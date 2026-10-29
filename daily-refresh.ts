import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://hpiljububwgycwhrubkz.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaWxqdWJ1YndneWN3aHJ1Ymt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTA2MDQsImV4cCI6MjEwMjU2NjYwNH0.0APGaI3qiLuN7ObUO09OoAUJMY8xbtBsIRBovWXSDjA';

const REPORTING_API_KEY =
  process.env.REPORTING_API_KEY ||
  process.env.API_SECRET_KEY ||
  'nti_reporting_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COURSE_QUESTIONS = [
  'Course outcomes were clear and specific',
  'Course content was current and relevant',
  'Topics presented in logical sequence',
  'Learning activities relevant to content',
  'Sufficient time for learning activities',
  'Sufficient time for discussion',
  'Material readable, attractive & high standard',
  'Overall content rating',
];

const FACILITATOR_QUESTIONS = [
  'Well prepared, knowledgeable & practical',
  'Relayed learnings effectively',
  'Enthusiastic, approachable & answered questions',
  'Gave clear instructions for exercises',
  'Handled course mechanics effectively',
  'Kept programme varied, dynamic & interesting',
  'Overall facilitator rating',
];

const JOURNEY_QUESTIONS = [
  'Learning outcomes met training needs',
  'Able to apply learnings in the job',
  'Learning climate was positive',
  'Would recommend programme to others',
  'Overall course journey rating',
];

function formatTime(val: string | null | undefined): string {
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

function calculateAverage(ratings: number[] | null | undefined): number | null {
  if (!ratings || ratings.length === 0) return null;
  const valid = ratings.filter((r) => typeof r === 'number' && r > 0);
  if (valid.length === 0) return null;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. API Key Authentication Check
  const reqKey =
    req.headers['x-api-key'] ||
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query?.key ||
    req.query?.apiKey;

  if (!reqKey || reqKey !== REPORTING_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized: Valid x-api-key header or ?key parameter required.',
    });
  }

  try {
    // 2. Fetch all attendance & delegate records from Supabase
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance')
      .select('*, students(*)')
      .order('attendance_date', { ascending: false })
      .order('time_in', { ascending: false });

    if (attError) {
      console.error('[Reporting API] Supabase query error:', attError);
      return res.status(500).json({ error: `Database error: ${attError.message}` });
    }

    const records = attendanceRecords || [];

    // 3. Compute High-Level Metrics
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = records.filter((r) => r.attendance_date === todayStr);

    const onSiteCount = records.filter((r) => r.status === 'Signed In' && !r.time_out).length;
    const signedOutCount = records.filter((r) => r.status === 'Signed Out' || Boolean(r.time_out)).length;
    
    // Unique delegates
    const uniqueDelegates = new Set(records.map((r) => r.student_id || r.students?.student_number)).size;

    // Averages across all evaluations
    const allCourseRatings = records.flatMap((r) => r.course_ratings || []).filter((v) => v > 0);
    const avgCourseRating =
      allCourseRatings.length > 0
        ? (allCourseRatings.reduce((a, b) => a + b, 0) / allCourseRatings.length).toFixed(2)
        : 'N/A';

    const allFacRatings = records.flatMap((r) => r.facilitator_ratings || []).filter((v) => v > 0);
    const avgFacRating =
      allFacRatings.length > 0
        ? (allFacRatings.reduce((a, b) => a + b, 0) / allFacRatings.length).toFixed(2)
        : 'N/A';

    // 4. Build Sheet 1: Dashboard KPI Table
    const dashboardRows = [
      ['NTI TRAINING ATTENDANCE & EVALUATION DASHBOARD'],
      ['Last Refreshed', new Date().toLocaleString()],
      ['Report Status', 'Live Synchronized'],
      [],
      ['Metric', 'Value'],
      ['Total Delegate Sessions Logged', records.length],
      ['Total Unique Registered Delegates', uniqueDelegates],
      ['Sessions Today', todayRecords.length],
      ['Currently On Site (Signed In)', onSiteCount],
      ['Completed Sessions (Signed Out)', signedOutCount],
      ['Overall Average Course Rating', `${avgCourseRating} / 5.0`],
      ['Overall Average Facilitator Rating', `${avgFacRating} / 5.0`],
    ];

    // 5. Build Sheet 2: Attendance Register Table
    const attendanceHeaders = [
      '#',
      'Surname',
      'First Name',
      'Student / ID Number',
      'Programme',
      'Facilitator',
      'Attendance Date',
      'Time In',
      'Time Out',
      'Duration On Site',
      'Status',
      'Email Address',
      'Cell Phone',
      'Further Studies Interest',
    ];

    const attendanceRows: (string | number)[][] = [attendanceHeaders];

    records.forEach((r, idx) => {
      attendanceRows.push([
        idx + 1,
        r.students?.last_name || '—',
        r.students?.first_name || '—',
        r.students?.student_number || '—',
        r.programme || r.students?.programme || '—',
        r.facilitator || r.students?.facilitator || '—',
        r.attendance_date || '—',
        formatTime(r.time_in),
        formatTime(r.time_out),
        calculateDuration(r.time_in, r.time_out),
        r.status === 'Signed Out' || Boolean(r.time_out) ? 'Signed Out' : 'Signed In (On Site)',
        r.students?.email || '—',
        r.cell_phone || r.students?.cell_phone || r.students?.phone || '—',
        r.further_studies || r.students?.further_studies || 'None',
      ]);
    });

    // 6. Build Sheet 3: Evaluations & Feedback Table
    const evalHeaders = [
      '#',
      'Delegate Name',
      'Student / ID Number',
      'Programme',
      'Facilitator',
      'Attendance Date',
      'Sign-Out Time',
      'Course Score (Avg)',
      'Course Feedback',
      'Facilitator Score (Avg)',
      'Facilitator Feedback',
      'Journey Score (Avg)',
      'Journey Feedback',
    ];

    const evalRows: (string | number)[][] = [evalHeaders];

    const evalRecords = records.filter(
      (r) =>
        Boolean(r.time_out) ||
        (r.course_ratings && r.course_ratings.length > 0) ||
        Boolean(r.course_comments) ||
        Boolean(r.facilitator_comments) ||
        Boolean(r.journey_comments)
    );

    evalRecords.forEach((r, idx) => {
      const courseAvg = calculateAverage(r.course_ratings);
      const facAvg = calculateAverage(r.facilitator_ratings);
      const journeyAvg = calculateAverage(r.journey_ratings);

      evalRows.push([
        idx + 1,
        `${r.students?.first_name || ''} ${r.students?.last_name || ''}`.trim() || '—',
        r.students?.student_number || '—',
        r.programme || r.students?.programme || '—',
        r.facilitator || r.students?.facilitator || '—',
        r.attendance_date || '—',
        formatTime(r.time_out),
        courseAvg !== null ? `${courseAvg} / 5` : '—',
        r.course_comments || 'None',
        facAvg !== null ? `${facAvg} / 5` : '—',
        r.facilitator_comments || 'None',
        journeyAvg !== null ? `${journeyAvg} / 5` : '—',
        r.journey_comments || 'None',
      ]);
    });

    // 7. Build Sheet 4: Daily Summary Rollup
    const dateMap = new Map<string, { total: number; onSite: number; signedOut: number }>();

    records.forEach((r) => {
      const d = r.attendance_date || 'Unknown';
      const existing = dateMap.get(d) || { total: 0, onSite: 0, signedOut: 0 };
      existing.total += 1;
      if (r.status === 'Signed In' && !r.time_out) {
        existing.onSite += 1;
      } else {
        existing.signedOut += 1;
      }
      dateMap.set(d, existing);
    });

    const summaryHeaders = ['Date', 'Total Delegates', 'Completed / Signed Out', 'Currently On Site', 'Completion Rate'];
    const summaryRows: (string | number)[][] = [summaryHeaders];

    Array.from(dateMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .forEach(([dateStr, counts]) => {
        const rate = counts.total > 0 ? ((counts.signedOut / counts.total) * 100).toFixed(1) + '%' : '0%';
        summaryRows.push([dateStr, counts.total, counts.signedOut, counts.onSite, rate]);
      });

    // 8. Return structured payload for automated sync
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalRecords: records.length,
        uniqueDelegates,
        todayTotal: todayRecords.length,
        onSite: onSiteCount,
        signedOut: signedOutCount,
        avgCourseRating,
        avgFacRating,
      },
      sheets: {
        dashboard: dashboardRows,
        attendance: attendanceRows,
        evaluations: evalRows,
        dailySummary: summaryRows,
      },
      rawRecords: records,
    });
  } catch (err: any) {
    console.error('[Reporting API] Unexpected error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error processing report.' });
  }
}
