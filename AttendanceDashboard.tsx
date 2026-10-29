import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PageLayout from '@/components/PageLayout';
import DashboardCard from '@/components/DashboardCard';
import AttendanceTable from '@/components/AttendanceTable';
import EmailDiagnosticsModal from '@/components/EmailDiagnosticsModal';
import SearchBar from '@/components/SearchBar';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { listAttendance, AttendanceRecord, today, getNotificationEmails } from '@/lib/attendance';
import { exportAttendanceToExcel } from '@/lib/excelExport';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LogIn, LogOut, Users, ImageOff, RefreshCw, Download, Radio, Mail, FileSpreadsheet, ChevronDown, Check } from 'lucide-react';

const PAGE_SIZE = 8;

export default function AttendanceDashboard() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Signed In' | 'Signed Out'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCount, setEmailCount] = useState<number>(() => getNotificationEmails().length);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const data = await listAttendance();
      setRecords(data);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Could not load attendance.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    // 1. Supabase Realtime Subscription for instantaneous table updates
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('attendance_dashboard_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          load(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
          load(true);
        })
        .subscribe();
    }

    // 2. Fallback polling loop every 8 seconds
    const interval = setInterval(() => {
      load(true);
    }, 8000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const name = `${r.students?.first_name || ''} ${r.students?.last_name || ''}`.toLowerCase();
      const num = r.students?.student_number?.toLowerCase() || '';
      const prog = (r.programme || r.students?.programme || '').toLowerCase();
      const s = search.toLowerCase();

      if (search && !name.includes(s) && !num.includes(s) && !prog.includes(s)) return false;

      if (statusFilter === 'Signed In' && (r.status !== 'Signed In' || Boolean(r.time_out))) return false;
      if (statusFilter === 'Signed Out' && r.status !== 'Signed Out' && !r.time_out) return false;

      if (dateFilter && r.attendance_date !== dateFilter) return false;
      return true;
    });
  }, [records, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const latestByStudent = new Map<string, AttendanceRecord>();
    for (const r of records) {
      const studentKey = r.student_id || r.students?.student_number || r.id;
      if (studentKey && !latestByStudent.has(studentKey)) {
        latestByStudent.set(studentKey, r);
      }
    }

    const latestList = Array.from(latestByStudent.values());
    const onSiteCount = latestList.filter((r) => r.status === 'Signed In' && !r.time_out).length;
    const signedOutCount = latestList.filter((r) => r.status === 'Signed Out' || Boolean(r.time_out)).length;

    const todayStr = today();
    const todayLocal = new Date().toDateString();
    const todayTotal = records.filter(
      (r) => r.attendance_date === todayStr || (r.time_in && new Date(r.time_in).toDateString() === todayLocal)
    ).length;

    return {
      onSite: onSiteCount,
      signedOut: signedOutCount,
      todayTotal,
      totalStudents: latestList.length,
      missingPhotos: records.filter((r) => !r.students?.id_photo_url).length,
    };
  }, [records]);

  const triggerExportSuccess = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(''), 4000);
  };

  const handleExportExcel = (onlyFiltered: boolean) => {
    setIsExportMenuOpen(false);
    const targetRecords = onlyFiltered ? filtered : records;
    if (targetRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    let filterLabel = 'All Historical Records';
    if (onlyFiltered) {
      const filterParts = [];
      if (dateFilter) filterParts.push(`Date: ${dateFilter}`);
      if (statusFilter !== 'all') filterParts.push(`Status: ${statusFilter}`);
      if (search) filterParts.push(`Search: "${search}"`);
      filterLabel = filterParts.length > 0 ? filterParts.join(', ') : 'Filtered View';
    }

    const fileSuffix = onlyFiltered && dateFilter ? dateFilter : today();
    exportAttendanceToExcel(targetRecords, {
      fileName: `NTI-Attendance-Report-${fileSuffix}.xlsx`,
      dateFilterLabel: filterLabel,
    });
    triggerExportSuccess(`Excel spreadsheet downloaded (${targetRecords.length} records)`);
  };

  const exportCsv = () => {
    setIsExportMenuOpen(false);
    if (filtered.length === 0) {
      alert('No records available to export.');
      return;
    }
    const rows = [
      ['First Name', 'Last Name', 'Student Number', 'Programme', 'Facilitator', 'Date', 'Time In', 'Time Out', 'Status', 'Email', 'Phone'],
    ];
    filtered.forEach((r) => {
      rows.push([
        r.students?.first_name || '',
        r.students?.last_name || '',
        r.students?.student_number || '',
        r.programme || r.students?.programme || '',
        r.facilitator || r.students?.facilitator || '',
        r.attendance_date,
        r.time_in ? new Date(r.time_in).toLocaleTimeString() : '',
        r.time_out ? new Date(r.time_out).toLocaleTimeString() : '',
        r.status,
        r.students?.email || '',
        r.cell_phone || r.students?.cell_phone || r.students?.phone || '',
      ]);
    });
    const csv = rows.map((row) => row.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerExportSuccess(`CSV file downloaded (${filtered.length} records)`);
  };

  return (
    <PageLayout>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-nti-navy tracking-tight">Attendance Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" /> Live Status
            </span>
          </div>
          <p className="mt-2 text-gray-500">Real-time attendance & current status tracking across campus.</p>
          {exportSuccessMsg && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              {exportSuccessMsg}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEmailCount(getNotificationEmails().length);
              setIsEmailModalOpen(true);
            }}
            className="border border-slate-200 hover:border-slate-300 bg-white text-xs sm:text-sm"
          >
            <Mail className="w-4 h-4 text-blue-600" /> Email Notifications ({emailCount})
          </Button>
          <Button variant="secondary" onClick={() => load(false)} disabled={loading || refreshing} className="text-xs sm:text-sm">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          {/* Export to Excel Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <Button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (.xlsx)
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Spreadsheet Export Options
                </div>
                <button
                  onClick={() => handleExportExcel(true)}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm text-gray-800 flex items-start gap-2.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Excel (.xlsx) — Current View</div>
                    <div className="text-xs text-gray-500">
                      Exports currently filtered records ({filtered.length} records)
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleExportExcel(false)}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm text-gray-800 flex items-start gap-2.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Excel (.xlsx) — All Records</div>
                    <div className="text-xs text-gray-500">
                      Exports complete historical database ({records.length} records)
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={exportCsv}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-gray-600 flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Simple CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard label="Currently On Site" value={stats.onSite} icon={Users} tone="amber" />
        <DashboardCard label="Signed Out" value={stats.signedOut} icon={LogOut} tone="green" />
        <DashboardCard label="Total Students" value={stats.totalStudents} icon={LogIn} tone="navy" />
        <DashboardCard label="Missing ID Photos" value={stats.missingPhotos} icon={ImageOff} tone="red" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search delegate, number, programme..."
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-nti-navy/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('Signed In');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'Signed In' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-600 hover:text-amber-800'
              }`}
            >
              ● On Site ({stats.onSite})
            </button>
            <button
              onClick={() => {
                setStatusFilter('Signed Out');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'Signed Out' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-emerald-800'
              }`}
            >
              ✓ Signed Out ({stats.signedOut})
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading attendance..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : paged.length === 0 ? (
          <EmptyState title="No attendance records found" message="Try clearing your search or filters." />
        ) : (
          <>
            <AttendanceTable records={paged} />
            <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <EmailDiagnosticsModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailCount(getNotificationEmails().length);
        }}
      />
    </PageLayout>
  );
}
