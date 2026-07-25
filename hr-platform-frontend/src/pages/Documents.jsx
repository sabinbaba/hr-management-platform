import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Documents() {
  const { user } = useAuth();
  const isPrivileged = user.role === 'ADMIN' || user.role === 'HR';

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function init() {
      if (isPrivileged) {
        const res = await api.get('/employees');
        setEmployees(res.data.employees);
        setLoading(false);
      } else {
        const res = await api.get('/employees/my');
        setSelectedEmployeeId(res.data.employee.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    fetchDocuments(selectedEmployeeId);
  }, [selectedEmployeeId]);

  async function fetchDocuments(employeeId) {
    setLoading(true);
    const res = await api.get(`/documents/${employeeId}`);
    setDocuments(res.data.documents);
    setLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/documents/${selectedEmployeeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      e.target.reset();
      await fetchDocuments(selectedEmployeeId);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDownload(doc) {
    api.get(`/documents/download/${doc.id}`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  }

  return (
    <Layout title="Documents">
      {isPrivileged && (
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
          <label className="block text-sm text-gray-600 mb-1">Select employee</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Choose an employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {selectedEmployeeId && (
        <>
          <form onSubmit={handleUpload} className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload a document</h3>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm mb-4 block"
            />
            {uploadError && <p className="text-sm text-red-600 mb-4">{uploadError}</p>}
            <button
              type="submit"
              disabled={!file || uploading}
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {loading ? (
            <p className="text-gray-400">Loading documents...</p>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
              <div className="overflow-x-auto">
          <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">File Name</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Uploaded</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-4 font-medium text-gray-800">{doc.fileName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-sm text-accent hover:text-accent-hover"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                        No documents uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
