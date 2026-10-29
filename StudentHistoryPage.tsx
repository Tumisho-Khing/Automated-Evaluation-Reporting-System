import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import SearchBar from '@/components/SearchBar';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { lookupStudent, StudentWithHistory } from '@/lib/attendance';
import { exportStudentHistoryToExcel } from '@/lib/excelExport';
import { Search, Phone, Mail, BookOpen, IdCard, FileSpreadsheet } from 'lucide-react';

export default function StudentHistoryPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [student, setStudent] = useState<StudentWithHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await lookupStudent(query);
      setStudent(data);
      setSubmitted(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not search students.');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const history = student?.attendance
    ?.slice()
    .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()) || [];

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-nti-navy tracking-tight">Student Lookup</h1>
        <p className="mt-2 text-gray-500">Search an individual student by number or name to view their attendance history.</p>
      </div>

      <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 mb-8">
        <SearchBar value={query} onChange={setQuery} placeholder="Student number or name..." />
        <Button type="submit"><Search className="w-4 h-4" /> Search</Button>
      </form>

      {loading ? (
        <LoadingSpinner label="Searching..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : searched && !student ? (
        <EmptyState title="No student found" message={`No student matches "${submitted}".`} />
      ) : student ? (
        <div className="grid lg:grid-cols-3 gap-6 fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {student.id_photo_url ? (
                <img src={student.id_photo_url} alt="ID" className="w-full h-full object-cover" />
              ) : (
                <IdCard className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{student.student_number}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{student.phone || student.cell_phone || 'No phone on file'}</span>
              </div>
              {student.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.programme && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{student.programme}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
              {history.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => exportStudentHistoryToExcel(student)}
                  className="text-xs border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Student Excel
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <EmptyState title="No attendance records" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Time In</th>
                      <th className="px-3 py-2 font-medium">Time Out</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(r.attendance_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(r.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          {r.time_out ? new Date(r.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              r.status === 'Signed Out' ? 'bg-success-green/10 text-success-green' : 'bg-nti-navy/10 text-nti-navy'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
