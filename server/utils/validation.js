/**
 * @fileoverview Utility functions for validating extracted student data.
 */

export const validatePhone = (phone) => {
  // Allow empty string as it might be optional, or check format if present
  if (!phone) return true; // Let mongoose/model schema handle required status
  
  const phoneStr = String(phone).replace(/\D/g, ""); // Remove non-digit characters
  // Relaxed validation (5 to 15 digits) to allow test data / international formats
  return phoneStr.length >= 5 && phoneStr.length <= 15;
};

export const validateEmail = (email) => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const cleanPhone = (phone) => {
  if (!phone) return "";
  const phoneStr = String(phone).replace(/\D/g, "");
  return phoneStr.slice(-15); // Keep up to 15 digits
};

export const cleanEmail = (email) => {
  return typeof email === 'string' ? email.toLowerCase().trim() : "";
};

export const validateRank = (rank) => {
  const num = Number(rank);
  return !isNaN(num) && num > 0;
};

export const cleanString = (str) => {
  if (!str) return "";
  return String(str).trim();
};

export const isValidStudentData = (student) => {
  const errors = [];
  
  if (!student.hallTicketNumber) {
    errors.push("Missing hall ticket number");
  }
  
  if (!student.name) {
    errors.push("Missing student name");
  }
  
  if (!validateRank(student.rank)) {
    errors.push("Invalid or missing rank");
  }
  
  if (!student.department) {
    errors.push("Missing department");
  }
  
  if (!student.phone) {
    errors.push("Missing phone number");
  } else if (!validatePhone(student.phone)) {
    errors.push("Invalid phone number format");
  }
  
  if (student.email && !validateEmail(student.email)) {
    errors.push("Invalid email format");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
