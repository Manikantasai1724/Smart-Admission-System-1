// Heavy libraries (xlsx, file-saver, jspdf, jspdf-autotable) are imported dynamically in export helpers to optimize bundle size.

/**
 * Format date to a readable string
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function timeAgo(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get status color class based on completion percentage
 */
export function getStatusColor(percentage) {
  if (percentage >= 100) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 50) return 'text-blue-600 dark:text-blue-400';
  if (percentage > 0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get status background color based on completion percentage
 */
export function getStatusBgColor(percentage) {
  if (percentage >= 100) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (percentage >= 50) return 'bg-blue-100 dark:bg-blue-900/30';
  if (percentage > 0) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

/**
 * Get status label
 */
export function getStatusLabel(percentage) {
  if (percentage >= 100) return 'Completed';
  return 'Pending';
}

/**
 * Calculate completion percentage from 3 boolean fields
 */
export function calculateCompletionPercentage(student) {
  if (!student) return 0;
  const steps = [
    student.selfReported,
    student.documentsSubmitted,
    student.formFilled,
  ];
  const completed = steps.filter(Boolean).length;
  return Math.round((completed / 3) * 100);
}

export async function exportToExcel(data, filename = 'export') {
  const XLSX = await import('xlsx');
  const { saveAs } = await import('file-saver');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2,
  }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

export async function exportToPDF(data, columns, title = 'Report', filename = '') {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(99, 102, 241);
  doc.text(title, 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

  // Table
  const tableColumn = columns.map(col => col.header || col);
  const tableRows = data.map(row =>
    columns.map(col => {
      const key = col.key || col;
      const value = row[key];
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return value ?? '—';
    })
  );

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 36,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 255],
    },
  });

  const pdfFilename = filename || title.toLowerCase().replace(/\s+/g, '_');
  doc.save(`${pdfFilename}.pdf`);
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Truncate text
 */
export function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}
