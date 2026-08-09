export const DEPARTMENTS = ["CSE", "AIM", "CIC"];

export const STATUS_FILTERS = ["all", "completed", "pending", "in-progress"];

export const STATUS_COLORS = {
  completed: "green",
  pending: "amber",
  "in-progress": "blue",
  missing: "red",
};

export const ADMISSION_STEPS = [
  "formIssuing",
  "certificateScan",
  "photoCapture",
  "onlineFormFilling",
  "reportSubmission",
];

export const STEP_LABELS = {
  formIssuing: "Form Issuing",
  certificateScan: "Certificate Scanning",
  photoCapture: "Photo Capture",
  onlineFormFilling: "Online Form Filling",
  reportSubmission: "Report Submission",
};

export const ROLES = {
  ADMIN: "Admin",
  HOD: "HOD",
  VOLUNTEER: "Volunteer",
};

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
