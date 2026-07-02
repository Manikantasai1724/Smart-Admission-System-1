/**
 * @fileoverview File-parsing service.
 * Accepts an uploaded file path and MIME type, delegates to the correct
 * parser (xlsx · csv · pdf), and returns an array of normalised student
 * objects ready for database insertion.
 */

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import csvParser from "csv-parser";
import pdfParse from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import config from "../config/env.js";
import { isValidStudentData, cleanPhone, cleanEmail } from "../utils/validation.js";

// ── Column-name aliases ──────────────────────────────────────────────────────
const COLUMN_MAP = {
  hallticketno: "hallTicketNumber",
  hallticketnumber: "hallTicketNumber",
  hall_ticket_no: "hallTicketNumber",
  hall_ticket_number: "hallTicketNumber",
  "hall ticket": "hallTicketNumber",
  "hall ticket no": "hallTicketNumber",
  "hall ticket number": "hallTicketNumber",
  htno: "hallTicketNumber",
  "ht no": "hallTicketNumber",
  ht_no: "hallTicketNumber",
  hallticket: "hallTicketNumber",
  name: "name",
  "student name": "name",
  studentname: "name",
  student_name: "name",
  "full name": "name",
  fullname: "name",
  rank: "rank",
  "eamcet rank": "rank",
  eamcetrank: "rank",
  eamcet_rank: "rank",
  "merit rank": "rank",
  department: "department",
  dept: "department",
  branch: "department",
  studentphone: "phone",
  "student phone": "phone",
  student_phone: "phone",
  "student mobile": "phone",
  phone: "phone",
  mobile: "phone",
  contact: "phone",
  email: "email",
  "email id": "email",
  emailid: "email",
  email_id: "email",
  "student email": "email",
  parentname: "parentName",
  "parent name": "parentName",
  parent_name: "parentName",
  "father name": "parentName",
  "mother name": "parentName",
  parentphone: "parentPhone",
  "parent phone": "parentPhone",
  parent_phone: "parentPhone",
  "parent mobile": "parentPhone",
  "guardian mobile": "parentPhone",
  "guardian phone": "parentPhone",
  address: "address",
  location: "address",
  city: "address",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const mapColumn = (raw) => {
  if (!raw) return null;
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
  if (COLUMN_MAP[key]) return COLUMN_MAP[key];
  const collapsed = key.replace(/\s+/g, "");
  if (COLUMN_MAP[collapsed]) return COLUMN_MAP[collapsed];
  return null;
};

const normalizeRow = (row) => {
  const student = {};

  for (const [rawKey, value] of Object.entries(row)) {
    const field = mapColumn(rawKey);
    if (field) {
      student[field] = typeof value === "string" ? value.trim() : value;
    }
  }

  if (student.rank !== undefined) {
    student.rank = Number(student.rank);
    if (Number.isNaN(student.rank)) delete student.rank;
  }

  if (student.phone) student.phone = cleanPhone(student.phone);
  if (student.parentPhone) student.parentPhone = cleanPhone(student.parentPhone);
  if (student.email) student.email = cleanEmail(student.email);

  const { isValid, errors } = isValidStudentData(student);
  if (!isValid) {
    student._isValid = false;
    student._validationErrors = errors;
  } else {
    student._isValid = true;
  }

  return student;
};

// ── Parsers ──────────────────────────────────────────────────────────────────

const parseXlsx = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
  });

  return rawRows.map(normalizeRow).filter(Boolean);
};

const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        const student = normalizeRow(row);
        if (student) results.push(student);
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

/**
 * Intelligent parser for text extracted from PDFs.
 * Handles tabular, paragraph, and mixed formats.
 */
const extractDataFromText = (text) => {
  const results = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  if (lines.length < 2) return results;

  // 1. Try tabular format (detect headers)
  const headerLineIndex = lines.findIndex(l => /hall\s*ticket|ht\s*no|name|rank|dept/i.test(l));

  if (headerLineIndex !== -1) {
    const headerLine = lines[headerLineIndex];
    const headers = headerLine.split(/\t+|\s{2,}/).map(h => h.trim()).filter(Boolean);

    if (headers.length >= 3) { // Looks like a valid table header
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const cols = lines[i].split(/\t+|\s{2,}/).map(c => c.trim()).filter(Boolean);
        if (cols.length < headers.length * 0.5) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        const student = normalizeRow(row);
        if (student) results.push(student);
      }
      if (results.length > 0) return results; // Successfully parsed as table
    }
  }

  // 2. If tabular parser fails to extract everything, fall back to LLM (if configured)
  // Or if we just couldn't parse any tabular format
  return results;
};

/**
 * AI-powered robust parser for unstructured PDF text.
 */
const extractDataWithGemini = async (text) => {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env. Cannot parse unstructured PDF.");
  }

  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

  const prompt = `
You are an expert data extraction assistant. I will provide you with raw text extracted from a PDF.
This text contains a list of student admission records. Some of it might be messy, OCR'd, or missing labels.

Extract ALL students found in the text. For each student, extract the following 9 fields:
1. hallTicketNumber (string, required, typically 8-15 alphanumeric characters)
2. name (string, required, student's full name)
3. rank (number, required, e.g. EAMCET rank)
4. department (string, required, e.g. CSE, ECE, IT, etc.)
5. phone (string, required, extract whatever phone number is present)
6. email (string, optional)
7. parentName (string, optional, father or mother's name)
8. address (string, optional, full address or location)
9. parentPhone (string, optional, extract whatever parent/guardian phone number is present)

Return a JSON array of objects. Do not invent data. If an optional field is missing, leave it as an empty string.

Raw Text:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hallticketno: { type: Type.STRING },
              name: { type: Type.STRING },
              rank: { type: Type.NUMBER },
              department: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              parentName: { type: Type.STRING },
              parentPhone: { type: Type.STRING },
              address: { type: Type.STRING },
            },
            required: ["hallticketno", "name", "rank", "department", "phone"],
          },
        },
      }
    });

    const parsedData = JSON.parse(response.text);
    const results = [];

    for (const record of parsedData) {
      const std = normalizeRow(record);
      if (std) results.push(std);
    }

    return results;
  } catch (error) {
    console.error("Gemini API extraction failed:", error);
    throw new Error("Failed to extract data using AI: " + error.message);
  }
};

/**
 * Best-effort parser for PDFs using pdf-parse, falling back to OCR.
 */
const parsePdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let text = "";

    try {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } catch (err) {
      console.warn("Failed standard PDF parsing.", err.message);
    }

    if (!text || !text.trim()) {
      throw new Error("No readable text could be extracted from this PDF.");
    }

    let results = [];

    // Always prefer Gemini AI if configured, as it guarantees perfect unstructured extraction
    if (config.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY found! Using AI to parse PDF...");
      results = await extractDataWithGemini(text);
    } else {
      console.log("No Gemini key found. Falling back to brittle tabular parser...");
      results = extractDataFromText(text);
    }

    if (results.length === 0) {
      throw new Error(
        "No valid student records found in PDF. Could not detect table or valid paragraph structure."
      );
    }

    return results;
  } catch (error) {
    throw new Error(
      `PDF parsing error: ${error.message || "Unknown error"}.`
    );
  }
};

// ── Public API ───────────────────────────────────────────────────────────────

export const parseFile = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeLC = (mimetype || "").toLowerCase();

  try {
    if (ext === ".xlsx" || ext === ".xls" || mimeLC.includes("spreadsheet") || mimeLC.includes("excel")) {
      return parseXlsx(filePath);
    }
    if (ext === ".csv" || mimeLC.includes("csv") || mimeLC.includes("comma")) {
      return await parseCsv(filePath);
    }
    if (ext === ".pdf" || mimeLC.includes("pdf")) {
      return await parsePdf(filePath);
    }
    throw new Error(`Unsupported file type: ${ext || mimetype}`);
  } catch (error) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore
    }
    throw error;
  }
};
