/**
 * @fileoverview Shared utility functions and constants.
 */

/**
 * List of all recognised departments.
 * @type {string[]}
 */
export const DEPARTMENTS = ["CSE", "AIML", "CIC"];

/**
 * Trim whitespace and escape basic HTML entities to prevent stored XSS.
 * @param {string} str - Raw user input.
 * @returns {string} Sanitised string.
 */
export const sanitizeInput = (str) => {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Build a MongoDB `$or` query that searches students by name,
 * hallTicketNumber, rank, or phone fields.
 *
 * @param {string} query - The search term entered by the user.
 * @returns {Object} A MongoDB filter object with an `$or` array.
 *
 * @example
 *   const filter = buildSearchQuery('Ravi');
 *   // { $or: [ { name: /Ravi/i }, { hallTicketNumber: /Ravi/i }, ... ] }
 */
export const buildSearchQuery = (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    return {};
  }

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const conditions = [
    { name: regex },
    { hallTicketNumber: regex },
    { phone: regex },
    { parentPhone: regex },
    { email: regex },
  ];

  // If the query looks numeric, also search by rank
  const numericValue = Number(query.trim());
  if (!Number.isNaN(numericValue)) {
    conditions.push({ rank: numericValue });
  }

  return { $or: conditions };
};
