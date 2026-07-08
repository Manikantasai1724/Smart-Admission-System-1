import Student from "../models/Student.js";
import AuditLog from "../models/AuditLog.js";
import Settings from "../models/Settings.js";

// Helper to calculate student phase
const calculateStudentPhase = (createdAt, startDateString) => {
  if (!startDateString) return "1";
  const start = new Date(startDateString);
  start.setHours(0, 0, 0, 0);
  
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  
  const diffTime = created.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return String(Math.max(1, diffDays + 1));
};

/**
 * Service to handle bulk inserting and deduplicating students.
 */
export const bulkInsertStudents = async (parsedStudents, userId, userRole) => {
  const hallTickets = parsedStudents
    .map((s) => s.hallTicketNumber)
    .filter((ht) => typeof ht === "string")
    .map((ht) => ht.toUpperCase());

  // Find existing records to skip duplicates
  const existing = await Student.find({
    hallTicketNumber: { $in: hallTickets },
  })
    .select("hallTicketNumber")
    .lean();

  const existingSet = new Set(existing.map((e) => e.hallTicketNumber));

  // Fetch the counseling start date setting
  const counselingSetting = await Settings.findOne({ key: "counselingStartDate" });

  const toInsert = [];
  const skipped = [];
  const errors = [];
  let invalidRows = 0;

  for (const record of parsedStudents) {
    if (!record.hallTicketNumber) {
      invalidRows++;
      continue;
    }
    
    if (record._isValid === false) {
      invalidRows++;
      errors.push({
        hallTicketNumber: record.hallTicketNumber,
        message: `Validation failed: ${(record._validationErrors || []).join(', ')}`
      });
      continue;
    }

    const htUpper = record.hallTicketNumber.toUpperCase();
    if (existingSet.has(htUpper)) {
      skipped.push(htUpper);
      continue;
    }
    
    existingSet.add(htUpper);

    // Clean up temporary validation flags
    const insertRecord = { ...record };
    delete insertRecord._isValid;
    delete insertRecord._validationErrors;

    const now = new Date();
    const calculatedPhase = counselingSetting?.value
      ? calculateStudentPhase(now, counselingSetting.value)
      : (insertRecord.phase || "1");

    toInsert.push({
      ...insertRecord,
      phase: calculatedPhase,
      hallTicketNumber: htUpper,
      uploadedBy: userId,
    });
  }

  let insertedDocs = [];
  if (toInsert.length > 0) {
    try {
      insertedDocs = await Student.insertMany(toInsert, { ordered: false });
    } catch (bulkError) {
      // Some may have inserted; capture the ones that failed
      if (bulkError.insertedDocs) {
        insertedDocs = bulkError.insertedDocs;
      }
      if (bulkError.writeErrors) {
        bulkError.writeErrors.forEach((we) => {
          errors.push({
            hallTicketNumber: toInsert[we.index]?.hallTicketNumber,
            message: we.errmsg || we.message,
          });
        });
      }
    }
  }

  // Create audit logs for inserted students
  if (insertedDocs.length > 0) {
    const auditEntries = insertedDocs.map((doc) => ({
      studentId: doc._id,
      updatedBy: userId,
      role: userRole,
      action: "STUDENT_CREATED",
      newValue: { hallTicketNumber: doc.hallTicketNumber, name: doc.name },
    }));
    await AuditLog.insertMany(auditEntries);
  }

  return {
    inserted: insertedDocs.length,
    skipped: skipped.length,
    errors,
    invalidRows
  };
};
