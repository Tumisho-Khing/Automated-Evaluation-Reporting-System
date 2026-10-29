import * as XLSX from 'xlsx';
import { AttendanceRecord, StudentWithHistory, today } from './attendance';

const courseQuestions = [
  '1. Course outcomes were clear and specific and addressed the outcomes',
  '2. Course content was current and relevant',
  '3. Topics were presented in a logical sequence and flow',
  '4. Learning activities were relevant to the course content',
  '5. Sufficient time was allocated for learning activities',
  '6. Sufficient time was allocated for discussion and understanding',
  '7. Material presented was easily readable, attractive, and high standard',
  '8. Overall rating of course content',
];

const facilitatorQuestions = [
  '1. Well prepared, knowledgeable, and shared practical application',
  '2. Able to relay learnings effectively',
  '3. Enthusiastic, approachable, and answered questions effectively',
  '4. Gave clear instructions regarding exercises and materials',
  '5. Handled course mechanics effectively (timing, breaks, equipment)',
  '6. Kept programme varied, dynamic, and interesting',
  '7. Overall rating of facilitator',
];

const journeyQuestions = [
  '1. Learning solution outcomes met training needs and expectations',
  '2. Able to apply learnings in the job',
  '3. Learning climate and atmosphere was positive',
  '4. Would recommend this programme to others',
  '5. Overall rating of the course journey',
];

function formatDateTime(val: string | null | undefined): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return val;
  }
}

function formatTimeOnly(val: string | null | undefined): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return val;
  }
}

function calculateDuration(timeIn: string | null | undefined, timeOut: string | null | undefined): string {
  if (!timeIn || !timeOut) return 'In Progress';
  try {
    const start = new Date(timeIn).getTime();
    const end = new Date(timeOut).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return '—';
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  } catch {
    return '—';
  }
}

function calculateAverage(ratings: number[] | null | undefined): string {
  if (!ratings || ratings.length === 0) return '—';
  const valid = ratings.filter((r) => typeof r === 'number' && r > 0);
  if (valid.length === 0) return '—';
  const sum = valid.reduce((a, b) => a + b, 0);
  return (sum / valid.length).toFixed(1) + ' / 5.0';
}

function autoFitColumns(data: (string | number)[][]): { wch: number }[] {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((val, colIdx) => {
      const cellLen = (val !== null && val !== undefined ? String(val) : '').length;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, cellLen + 3);
    });
  });
  // Cap width between 12 and 60
  return colWidths.map((w) => ({ wch: Math.min(Math.max(w, 12), 65) }));
}

export interface ExportExcelOptions {
  fileName?: string;
  title?: string;
  dateFilterLabel?: string;
}

/**
 * Builds and downloads a comprehensive, multi-sheet Excel Workbook (.xlsx)
 * containing full Attendance Register, Detailed Evaluations, and Summary Metrics.
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  options: ExportExcelOptions = {}
) {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: ATTENDANCE REGISTER
  // ==========================================
  const registerHeaders = [
    '#',
    'Delegate Surname',
    'Delegate First Names',
    'Student / ID Number',
    'Email Address',
    'Cell Phone',
    'Work Tel',
    'Programme',
    'Facilitator',
    'Attendance Date',
    'Time In',
    'Time Out',
    'Duration On Site',
    'Status',
    'Further Studies Interest',
    'Record Created At',
  ];

  const registerRows: (string | number)[][] = [registerHeaders];

  records.forEach((r, idx) => {
    registerRows.push([
      idx + 1,
      r.students?.last_name || '—',
      r.students?.first_name || '—',
      r.students?.student_number || '—',
      r.students?.email || '—',
      r.cell_phone || r.students?.cell_phone || r.students?.phone || '—',
      r.work_tel || r.students?.work_tel || '—',
      r.programme || r.students?.programme || '—',
      r.facilitator || r.students?.facilitator || '—',
      r.attendance_date || '—',
      formatTimeOnly(r.time_in),
      formatTimeOnly(r.time_out),
      calculateDuration(r.time_in, r.time_out),
      r.status === 'Signed Out' || Boolean(r.time_out) ? 'Signed Out' : 'Signed In (On Site)',
      r.further_studies || r.students?.further_studies || 'None',
      formatDateTime(r.created_at),
    ]);
  });

  const wsRegister = XLSX.utils.aoa_to_sheet(registerRows);
  wsRegister['!cols'] = autoFitColumns(registerRows);
  XLSX.utils.book_append_sheet(wb, wsRegister, 'Attendance Register');

  // ==========================================
  // SHEET 2: EVALUATIONS & FEEDBACK (SIGN-OUT)
  // ==========================================
  const evalHeaders = [
    '#',
    'Delegate Name',
    'Student / ID Number',
    'Programme',
    'Facilitator',
    'Attendance Date',
    'Sign-Out Time',
    'Course Avg Score',
    'Course Comments',
    ...courseQuestions.map((q) => `Course: ${q}`),
    'Facilitator Avg Score',
    'Facilitator Comments',
    ...facilitatorQuestions.map((q) => `Facilitator: ${q}`),
    'Journey Avg Score',
    'Journey Comments',
    ...journeyQuestions.map((q) => `Journey: ${q}`),
  ];

  const evalRows: (string | number)[][] = [evalHeaders];

  const recordsWithEval = records.filter(
    (r) =>
      Boolean(r.time_out) ||
      (r.course_ratings && r.course_ratings.length > 0) ||
      Boolean(r.course_comments) ||
      Boolean(r.facilitator_comments) ||
      Boolean(r.journey_comments)
  );

  recordsWithEval.forEach((r, idx) => {
    const courseScores = courseQuestions.map((_, i) => r.course_ratings?.[i] ?? '—');
    const facScores = facilitatorQuestions.map((_, i) => r.facilitator_ratings?.[i] ?? '—');
    const journeyScores = journeyQuestions.map((_, i) => r.journey_ratings?.[i] ?? '—');

    evalRows.push([
      idx + 1,
      `${r.students?.first_name || ''} ${r.students?.last_name || ''}`.trim() || '—',
      r.students?.student_number || '—',
      r.programme || r.students?.programme || '—',
      r.facilitator || r.students?.facilitator || '—',
      r.attendance_date || '—',
      formatTimeOnly(r.time_out),
      calculateAverage(r.course_ratings),
      r.course_comments || 'None',
      ...courseScores,
      calculateAverage(r.facilitator_ratings),
      r.facilitator_comments || 'None',
      ...facScores,
      calculateAverage(r.journey_ratings),
      r.journey_comments || 'None',
      ...journeyScores,
    ]);
  });

  const wsEval = XLSX.utils.aoa_to_sheet(evalRows);
  wsEval['!cols'] = autoFitColumns(evalRows);
  XLSX.utils.book_append_sheet(wb, wsEval, 'Evaluations & Feedback');

  // ==========================================
  // SHEET 3: SUMMARY & METRICS
  // ==========================================
  const signedOutCount = records.filter((r) => r.status === 'Signed Out' || Boolean(r.time_out)).length;
  const onSiteCount = records.filter((r) => r.status === 'Signed In' && !r.time_out).length;
  const totalRecords = records.length;

  // Calculate overall course & facilitator ratings across all records
  const allCourseRatings = records.flatMap((r) => r.course_ratings || []).filter((v) => v > 0);
  const avgCourseRating =
    allCourseRatings.length > 0
      ? (allCourseRatings.reduce((a, b) => a + b, 0) / allCourseRatings.length).toFixed(2) + ' / 5.0'
      : 'N/A';

  const allFacRatings = records.flatMap((r) => r.facilitator_ratings || []).filter((v) => v > 0);
  const avgFacRating =
    allFacRatings.length > 0
      ? (allFacRatings.reduce((a, b) => a + b, 0) / allFacRatings.length).toFixed(2) + ' / 5.0'
      : 'N/A';

  const summaryRows: (string | number)[][] = [
    ['NTI Sign-In & Sign-Out System — Attendance Report Summary'],
    ['Generated On', new Date().toLocaleString()],
    ['Report Filter / Scope', options.dateFilterLabel || 'All Active Records'],
    [],
    ['Key Metric', 'Count / Value'],
    ['Total Registered Sign-Ins', totalRecords],
    ['Currently On Site (Signed In)', onSiteCount],
    ['Completed Sessions (Signed Out)', signedOutCount],
    ['Evaluations Submitted', recordsWithEval.length],
    ['Overall Average Course Rating', avgCourseRating],
    ['Overall Average Facilitator Rating', avgFacRating],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary & Metrics');

  // ==========================================
  // WRITE & DOWNLOAD FILE
  // ==========================================
  const fileName = options.fileName || `NTI-Attendance-Records-${today()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports an individual student's complete historical attendance and evaluation profile to Excel (.xlsx).
 */
export function exportStudentHistoryToExcel(student: StudentWithHistory) {
  const wb = XLSX.utils.book_new();

  const history = student.attendance || [];
  const rows: (string | number)[][] = [
    [`NTI Student Attendance Profile — ${student.first_name} ${student.last_name}`],
    ['Student Number / ID', student.student_number],
    ['Email', student.email || '—'],
    ['Phone', student.phone || student.cell_phone || '—'],
    ['Programme', student.programme || '—'],
    ['Total Sessions Recorded', history.length],
    [],
    ['#', 'Date', 'Time In', 'Time Out', 'Duration', 'Status', 'Programme', 'Facilitator', 'Course Avg', 'Facilitator Avg'],
  ];

  history.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.attendance_date,
      formatTimeOnly(r.time_in),
      formatTimeOnly(r.time_out),
      calculateDuration(r.time_in, r.time_out),
      r.status,
      r.programme || student.programme || '—',
      r.facilitator || student.facilitator || '—',
      calculateAverage(r.course_ratings),
      calculateAverage(r.facilitator_ratings),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = autoFitColumns(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Student History');

  const safeName = `${student.first_name}_${student.last_name}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `NTI-Student-${safeName}-${student.student_number}-${today()}.xlsx`);
}
