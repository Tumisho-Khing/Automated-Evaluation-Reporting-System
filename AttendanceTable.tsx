import { useState } from 'react';
import { AttendanceRecord, resendAttendanceRecordNotification } from '@/lib/attendance';
import { User, CheckCircle2, Clock, Mail, Loader2, Check } from 'lucide-react';

const headers = [
  'Student / Delegate',
  'Student Number',
  'Programme',
  'Date',
  'Time In',
  'Time Out',
  'Current Status',
  'Notification',
];

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentSuccessId, setSentSuccessId] = useState<string | null>(null);

  const handleResend = async (record: AttendanceRecord) => {
    setSendingId(record.id);
    try {
      const result = await resendAttendanceRecordNotification(record);
      if (result.success) {
        setSentSuccessId(record.id);
        setTimeout(() => setSentSuccessId(null), 3000);
      } else {
        alert(`Failed to resend notification: ${result.error || 'Check email configuration.'}`);
      }
    } catch (err: any) {
      alert(`Error resending notification: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => {
            const hasPhoto = Boolean(r.students?.id_photo_url);
            const isSignedOut = r.status === 'Signed Out';
            const programme = r.programme || r.students?.programme || '—';
            const isSending = sendingId === r.id;
            const isSentSuccess = sentSuccessId === r.id;

            return (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      {hasPhoto ? (
                        <img src={r.students.id_photo_url!} alt="ID" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {r.students?.first_name} {r.students?.last_name}
                      </div>
                      {r.students?.email && (
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">{r.students.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                  {r.students?.student_number}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {programme}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {formatDate(r.attendance_date)}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-medium">
                  {formatTime(r.time_in)}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-medium">
                  {formatTime(r.time_out)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {isSignedOut ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Signed Out
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Signed In (On Site)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleResend(r)}
                    disabled={isSending}
                    title="Resend email notification for this record"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSentSuccess
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    } disabled:opacity-50`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        Sending...
                      </>
                    ) : isSentSuccess ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Dispatched
                      </>
                    ) : (
                      <>
                        <Mail className="w-3 h-3 text-slate-500" />
                        Resend
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
