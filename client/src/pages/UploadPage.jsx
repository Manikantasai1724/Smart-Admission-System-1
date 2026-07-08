import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info, Loader, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import FileUpload from '../components/students/FileUpload';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { uploadStudents, deleteAllStudents } from '../services/studentService';

function UploadPage() {
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setDeleting(true);
    setIsDeleteModalOpen(false);
    try {
      await deleteAllStudents();
      addToast('success', 'Successfully cleared all student data');
      handleReset();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete student data';
      addToast('error', message);
    } finally {
      setDeleting(false);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setResults(null);
    setPreviewData([]);

    // For XLSX/CSV, try to parse a preview
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
      import('xlsx').then((XLSX) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            setPreviewData(jsonData.slice(0, 10));
          } catch (err) {
            console.error('Error parsing file:', err);
          }
        };
        reader.readAsBinaryString(file);
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      addToast('warning', 'Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await uploadStudents(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setResults(res.data);
      addToast('success', `Successfully uploaded ${res.data.inserted || res.data.count || 0} students`);
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed. Please try again.';
      addToast('error', message);
      setResults({
        error: true,
        message,
        errors: error.response?.data?.errors || [],
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setResults(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40">
                <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              Upload Students
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Upload student data from Excel or CSV files to the system
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {deleting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Uploaded Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <FileUpload onFileSelect={handleFileSelect} />

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="glass-card overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-gray-200/50 dark:border-primary-400/10 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Preview ({previewData.length} rows shown)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-primary-950/30">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="text-left px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-primary-400/5">
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFile && !results && (
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="glass-button flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 w-full px-4">
                      <div className="flex items-center gap-2">
                         <Loader className="w-5 h-5 animate-spin" />
                         <span>Uploading {uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Confirm Upload
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Upload Results */}
            {results && (
              <div className={`glass-card p-6 animate-scale-in ${results.error ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
                <div className="flex items-start gap-3">
                  {results.error ? (
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${results.error ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {results.error ? 'Upload Failed' : 'Upload Successful'}
                    </h4>
                    {!results.error && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Total Records Parsed: <span className="font-bold">{results.totalRecords || 0}</span>
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.inserted || results.count || 0}</p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Imported</p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{results.skipped || 0}</p>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Duplicates Skipped</p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{results.invalidRows || 0}</p>
                            <p className="text-xs text-gray-600/70 dark:text-gray-400/70">Invalid Rows</p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{results.errors?.length || results.failed || 0}</p>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70">Errors</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {results.errors?.length > 0 && (
                      <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
                        {results.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                            <span className="font-mono">Row {err.row || i + 1}:</span> {err.message || err}
                          </p>
                        ))}
                      </div>
                    )}
                    {results.message && !results.error && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{results.message}</p>
                    )}
                    {results.error && results.message && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{results.message}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 w-full glass-button"
                >
                  Upload Another File
                </button>
              </div>
            )}
          </div>

          {/* Instructions Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary-500" />
                Upload Instructions
              </h3>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1.5">Accepted Formats</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">.xlsx</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">.csv</span>
                    <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium">.pdf</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1.5">Required Columns</h4>
                  <ul className="space-y-1.5">
                    {['Applicant Name', 'Hall Ticket', 'Rank', 'Branch'].map(col => (
                      <li key={col} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{col}</code>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1.5">Optional Columns</h4>
                  <ul className="space-y-1.5">
                    {['Gender', 'Caste', 'Region', 'Allotted Category', 'Phase', 'Remarks', 'Phone', 'Email', 'Parent Name', 'Parent Phone', 'Address'].map(col => (
                      <li key={col} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{col}</code>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                  <p className="font-semibold mb-1">⚠️ Important</p>
                  <p>Duplicate hall ticket numbers will be skipped. Maximum file size is 10MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Data Deletion"
        footer={
          <>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="glass-button text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-semibold shadow-md shadow-red-500/20"
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete all uploaded student data? This action will permanently delete:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <li>All student admission records</li>
            <li>All admission step completion records (self-reported, docs submitted, form filled)</li>
            <li>Associated student audit logs</li>
          </ul>
          <p className="text-red-500 dark:text-red-400 font-semibold text-sm">
            ⚠️ Warning: This action is irreversible and will delete all student records!
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default UploadPage;
