import Student from "../models/Student.js";
import AuditLog from "../models/AuditLog.js";
import Settings from "../models/Settings.js";

// Removed calculateStudentPhase (no longer needed)

/**
 * Service to handle bulk inserting and deduplicating students.
 */
export const bulkInsertStudents = async (parsedStudents, userId, userRole, targetPhase = '1') => {
  const hallTickets = parsedStudents
    .map((s) => s.hallTicketNumber)
    .filter((ht) => typeof ht === "string")
    .map((ht) => ht.toUpperCase());

  // Find existing records in the target phase to skip duplicates
  const existing = await Student.find({
    hallTicketNumber: { $in: hallTickets },
    phase: targetPhase
  })
    .select("hallTicketNumber")
    .lean();

  const existingSet = new Set(existing.map((e) => e.hallTicketNumber));

  let phase1Lookup = {};
  if (targetPhase === '2') {
    const phase1Students = await Student.find({
      hallTicketNumber: { $in: hallTickets },
      phase: '1'
    }).lean();

    phase1Lookup = phase1Students.reduce((acc, student) => {
      acc[student.hallTicketNumber] = {
        branch: student.department,
        status: `${student.completionPercentage}%`,
        linkedAt: new Date()
      };
      return acc;
    }, {});
  }

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

    if (targetPhase === '2' && phase1Lookup[htUpper]) {
      insertRecord.phase1Ref = phase1Lookup[htUpper];
    }

    toInsert.push({
      ...insertRecord,
      phase: targetPhase,
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
