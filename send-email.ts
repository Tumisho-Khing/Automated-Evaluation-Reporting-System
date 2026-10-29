import { Resend } from 'resend';

export interface SignInEmailData {
  delegateName: string;
  studentNumber: string;
  programme?: string | null;
  facilitator?: string | null;
  cellPhone?: string | null;
  workTel?: string | null;
  email?: string | null;
  trainingDate?: string | null;
  timeIn?: string | null;
  furtherStudies?: string | null;
  idPhotoUrl?: string | null;
}

export interface SignOutEmailData {
  delegateName: string;
  studentNumber: string;
  programme?: string | null;
  facilitator?: string | null;
  cellPhone?: string | null;
  workTel?: string | null;
  email?: string | null;
  venue?: string | null;
  trainingDate?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  furtherStudies?: string | null;
  courseRatings?: number[] | null;
  facilitatorRatings?: number[] | null;
  journeyRatings?: number[] | null;
  courseComments?: string | null;
  facilitatorComments?: string | null;
  journeyComments?: string | null;
  idPhotoUrl?: string | null;
}

interface RequestBody {
  type: 'sign-in' | 'sign-out' | 'test';
  data?: SignInEmailData | SignOutEmailData | any;
  recipients?: string[];
  testEmail?: string;
}

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
  'Clear instructions regarding exercises',
  'Handled course mechanics effectively',
  'Kept programme varied, dynamic & interesting',
  'Overall facilitator rating',
];

const JOURNEY_QUESTIONS = [
  'Outcomes met my training needs/expectations',
  'Able to apply what I learnt on the job',
  'Positive learning climate and atmosphere',
  'Would recommend this programme to others',
  'Overall course rating',
];

function formatTime(isoOrStr?: string | null): string {
  if (!isoOrStr) return '—';
  try {
    const d = new Date(isoOrStr);
    return isNaN(d.getTime()) ? isoOrStr : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrStr;
  }
}

function formatDate(isoOrStr?: string | null): string {
  if (!isoOrStr) return '—';
  try {
    const d = new Date(isoOrStr);
    return isNaN(d.getTime()) ? isoOrStr : d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoOrStr;
  }
}

function renderRatingsTable(title: string, questions: string[], ratings?: number[] | null, comments?: string | null): string {
  if (!ratings || ratings.length === 0) {
    return `
      <div style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
        <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 14px;">${title}</h4>
        <p style="margin: 0; color: #64748b; font-size: 13px;">No rating provided.</p>
      </div>
    `;
  }

  const validScores = ratings.filter((r) => typeof r === 'number' && r > 0);
  const avgScore = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : '—';

  const rows = questions
    .map((q, idx) => {
      const score = ratings[idx];
      const scoreLabel = score ? `${score} / 5` : '—';
      const badgeBg = score >= 4 ? '#dcfce7' : score === 3 ? '#fef3c7' : '#fee2e2';
      const badgeColor = score >= 4 ? '#166534' : score === 3 ? '#92400e' : '#991b1b';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 10px; font-size: 12px; color: #334155;">${idx + 1}. ${q}</td>
          <td style="padding: 8px 10px; font-size: 12px; text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px;">
              ${scoreLabel}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #0f172a; font-size: 14px;">${title}</strong>
        <span style="font-size: 12px; color: #475569; font-weight: 600; float: right;">Average: ${avgScore} / 5.0</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${
        comments
          ? `<div style="padding: 10px 14px; background-color: #fafafa; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #334155;">
              <strong style="color: #475569;">Comments / Feedback:</strong> ${comments}
            </div>`
          : ''
      }
    </div>
  `;
}

function renderIdPhotoSection(idPhotoUrl?: string | null): string {
  if (!idPhotoUrl) return '';

  const isHttp = idPhotoUrl.startsWith('http');
  const isData = idPhotoUrl.startsWith('data:');

  return `
    <tr>
      <td colspan="2" style="padding: 16px; background-color: #f8fafc; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Attached ID Document / Photo</div>
        ${
          isHttp || isData
            ? `<div style="margin-bottom: 12px;">
                <img src="${idPhotoUrl}" alt="ID Document Photo" style="max-width: 260px; max-height: 180px; border-radius: 6px; border: 1px solid #cbd5e1; object-fit: contain; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
              </div>`
            : ''
        }
        ${
          isHttp
            ? `<a href="${idPhotoUrl}" target="_blank" style="display: inline-block; padding: 6px 16px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">
                View Full ID Document &rarr;
              </a>`
            : ''
        }
      </td>
    </tr>
  `;
}

function generateSignInEmailHtml(data: SignInEmailData): string {
  const photoSection = renderIdPhotoSection(data.idPhotoUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Sign-In Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 0.5px; font-weight: 700; text-transform: uppercase;">NewBridge Graduate Institute</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Attendance & Learning Management System</p>
    </div>

    <!-- Status Banner -->
    <div style="background-color: #f0fdf4; border-bottom: 2px solid #22c55e; padding: 14px 20px; text-align: center;">
      <span style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
        ✓ Delegate Signed In
      </span>
      <h2 style="margin: 8px 0 0 0; font-size: 18px; color: #15803d; font-weight: 700;">${data.delegateName}</h2>
    </div>

    <!-- Content -->
    <div style="padding: 24px 20px;">
      
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Delegate & Session Information</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; width: 40%; font-weight: 500;">Delegate Name</td>
            <td style="padding: 10px 6px; color: #0f172a; font-weight: 600;">${data.delegateName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">ID / Student Number</td>
            <td style="padding: 10px 6px; color: #0f172a; font-weight: 600; font-family: monospace;">${data.studentNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Programme</td>
            <td style="padding: 10px 6px; color: #0f172a; font-weight: 600;">${data.programme || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Facilitator</td>
            <td style="padding: 10px 6px; color: #0f172a; font-weight: 600;">${data.facilitator || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Date & Time In</td>
            <td style="padding: 10px 6px; color: #0f172a; font-weight: 600;">
              ${formatDate(data.trainingDate)} at <span style="color: #15803d;">${formatTime(data.timeIn)}</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Email Address</td>
            <td style="padding: 10px 6px; color: #0f172a;">${data.email || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Cell Phone / Tel</td>
            <td style="padding: 10px 6px; color: #0f172a;">${data.cellPhone || '—'} ${data.workTel ? `(Work: ${data.workTel})` : ''}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 6px; color: #64748b; font-weight: 500;">Further Studies Interest</td>
            <td style="padding: 10px 6px; color: #0f172a;">${data.furtherStudies || 'None indicated'}</td>
          </tr>
          ${photoSection}
        </tbody>
      </table>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #94a3b8;">
      This is an automated notification from the NewBridge Training Institute (NTI) Attendance System.
    </div>

  </div>
</body>
</html>
  `;
}

function generateSignInEmailText(data: SignInEmailData): string {
  return `
NEW DELEGATE SIGN-IN NOTIFICATION
=================================
Institute: NewBridge Graduate Institute
Status: Delegate Signed In

Delegate Name:       ${data.delegateName}
ID / Student Number: ${data.studentNumber}
Programme:           ${data.programme || 'N/A'}
Facilitator:         ${data.facilitator || 'N/A'}
Date & Time In:      ${formatDate(data.trainingDate)} at ${formatTime(data.timeIn)}
Email:               ${data.email || 'N/A'}
Phone / Work:        ${data.cellPhone || 'N/A'} ${data.workTel ? `(Work: ${data.workTel})` : ''}
Further Studies:     ${data.furtherStudies || 'None indicated'}

This is an automated notification from the NTI Attendance System.
`;
}

function generateSignOutEmailHtml(data: SignOutEmailData): string {
  const photoSection = renderIdPhotoSection(data.idPhotoUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign-Out & Learning Evaluation Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 0.5px; font-weight: 700; text-transform: uppercase;">NewBridge Graduate Institute</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Attendance & Learning Evaluation Report</p>
    </div>

    <!-- Status Banner -->
    <div style="background-color: #eff6ff; border-bottom: 2px solid #3b82f6; padding: 14px 20px; text-align: center;">
      <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
        ↗ Delegate Signed Out & Evaluated
      </span>
      <h2 style="margin: 8px 0 0 0; font-size: 18px; color: #1d4ed8; font-weight: 700;">${data.delegateName}</h2>
    </div>

    <!-- Content -->
    <div style="padding: 24px 20px;">
      
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Session Details</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; width: 40%; font-weight: 500;">Delegate Name</td>
            <td style="padding: 8px 6px; color: #0f172a; font-weight: 600;">${data.delegateName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Student / ID Number</td>
            <td style="padding: 8px 6px; color: #0f172a; font-weight: 600; font-family: monospace;">${data.studentNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Programme</td>
            <td style="padding: 8px 6px; color: #0f172a; font-weight: 600;">${data.programme || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Facilitator</td>
            <td style="padding: 8px 6px; color: #0f172a; font-weight: 600;">${data.facilitator || '—'}</td>
          </tr>
          ${data.venue ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Venue</td>
            <td style="padding: 8px 6px; color: #0f172a;">${data.venue}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Date</td>
            <td style="padding: 8px 6px; color: #0f172a;">${formatDate(data.trainingDate)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Time In / Out</td>
            <td style="padding: 8px 6px; color: #0f172a;">
              In: <strong>${formatTime(data.timeIn)}</strong> &nbsp;|&nbsp; Out: <strong style="color: #2563eb;">${formatTime(data.timeOut)}</strong>
            </td>
          </tr>
          ${data.email ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Email Address</td>
            <td style="padding: 8px 6px; color: #0f172a;">${data.email}</td>
          </tr>` : ''}
          ${data.cellPhone || data.workTel ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Contact Numbers</td>
            <td style="padding: 8px 6px; color: #0f172a;">${data.cellPhone || '—'} ${data.workTel ? `(Work: ${data.workTel})` : ''}</td>
          </tr>` : ''}
          ${data.furtherStudies ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 6px; color: #64748b; font-weight: 500;">Further Studies Interest</td>
            <td style="padding: 8px 6px; color: #0f172a;">${data.furtherStudies}</td>
          </tr>` : ''}
          ${photoSection}
        </tbody>
      </table>

      <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Learning Evaluation Scores</h3>
      
      ${renderRatingsTable('1. Course Content & Materials', COURSE_QUESTIONS, data.courseRatings, data.courseComments)}
      ${renderRatingsTable('2. Facilitator Effectiveness', FACILITATOR_QUESTIONS, data.facilitatorRatings, data.facilitatorComments)}
      ${renderRatingsTable('3. Learning Journey & Application', JOURNEY_QUESTIONS, data.journeyRatings, data.journeyComments)}

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #94a3b8;">
      This is an automated evaluation notification from the NewBridge Training Institute (NTI) Attendance System.
    </div>

  </div>
</body>
</html>
  `;
}

function generateSignOutEmailText(data: SignOutEmailData): string {
  return `
DELEGATE SIGN-OUT & EVALUATION REPORT
====================================
Institute: NewBridge Graduate Institute
Status: Delegate Signed Out & Evaluated

Delegate Name:       ${data.delegateName}
ID / Student Number: ${data.studentNumber}
Programme:           ${data.programme || 'N/A'}
Facilitator:         ${data.facilitator || 'N/A'}
Venue:               ${data.venue || 'N/A'}
Date:                ${formatDate(data.trainingDate)}
Time In / Out:       In: ${formatTime(data.timeIn)} | Out: ${formatTime(data.timeOut)}
Email:               ${data.email || 'N/A'}
Phone / Work:        ${data.cellPhone || 'N/A'} ${data.workTel ? `(Work: ${data.workTel})` : ''}

This is an automated notification from the NTI Attendance System.
`;
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-email API] ERROR: RESEND_API_KEY is not configured in environment variables.');
    return res.status(500).json({ error: 'Email service not configured (missing RESEND_API_KEY).' });
  }

  try {
    const body: RequestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, data, recipients: customRecipients, testEmail } = body;

    if (!type) {
      return res.status(400).json({ error: 'Missing "type" in request body.' });
    }

    // Determine target recipients
    let toRecipients: string[] = [];
    if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
      toRecipients = customRecipients;
    } else if (testEmail) {
      toRecipients = [testEmail];
    } else {
      const rawEmails =
        process.env.NOTIFICATION_EMAILS ||
        [process.env.NOTIFICATION_EMAIL_1, process.env.NOTIFICATION_EMAIL_2].filter(Boolean).join(',') ||
        'maphallaamari@gmail.com,bradleym@nti.edu.za,lindadv@ngi.ac.za';

      toRecipients = rawEmails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes('@'));
    }

    // Clean & deduplicate recipients
    toRecipients = Array.from(new Set(toRecipients.map((e) => e.trim().toLowerCase())));

    if (toRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses specified.' });
    }

    // Determine sender address based on notification type
    let fromSender = '';
    if (type === 'sign-in') {
      fromSender =
        process.env.RESEND_FROM_SIGNIN_EMAIL ||
        process.env.RESEND_FROM_EMAIL ||
        'NTI Sign-In <signin@attendance.niphokazi.com>';
    } else if (type === 'sign-out') {
      fromSender =
        process.env.RESEND_FROM_SIGNOUT_EMAIL ||
        process.env.RESEND_FROM_EMAIL ||
        'NTI Sign-Out <signout@attendance.niphokazi.com>';
    } else {
      fromSender =
        process.env.RESEND_FROM_EMAIL ||
        process.env.RESEND_FROM_SIGNIN_EMAIL ||
        'NTI Attendance <signin@attendance.niphokazi.com>';
    }

    const resend = new Resend(apiKey);

    let subject = '';
    let html = '';
    let text = '';
    const attachments: Array<{ filename: string; path?: string; content?: string }> = [];

    if (type === 'test') {
      subject = `[NTI Test Notification] Attendance System Delivery Verification`;
      html = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0;">NTI Attendance Email Delivery Test</h2>
          <p>This is a verified test email sent from the NewBridge Training Institute Attendance System.</p>
          <p><strong>Sender Address:</strong> ${fromSender}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you received this message, the email delivery pathway to your inbox is functioning correctly.</p>
        </div>
      `;
      text = `NTI Attendance Email Delivery Test\nTimestamp: ${new Date().toISOString()}\nSender: ${fromSender}\nIf you received this message, your inbox delivery is functioning correctly.`;
    } else if (type === 'sign-in') {
      if (!data) return res.status(400).json({ error: 'Missing "data" for sign-in notification.' });
      const signInData = data as SignInEmailData;
      const prog = signInData.programme ? ` - ${signInData.programme}` : '';
      subject = `[Sign In] ${signInData.delegateName} (${signInData.studentNumber})${prog}`;
      html = generateSignInEmailHtml(signInData);
      text = generateSignInEmailText(signInData);

      if (data.idPhotoUrl) {
        if (data.idPhotoUrl.startsWith('http')) {
          attachments.push({
            filename: `ID-${data.studentNumber || 'document'}.jpg`,
            path: data.idPhotoUrl,
          });
        } else if (data.idPhotoUrl.startsWith('data:')) {
          const base64Part = data.idPhotoUrl.split(',')[1];
          if (base64Part) {
            attachments.push({
              filename: `ID-${data.studentNumber || 'document'}.jpg`,
              content: base64Part,
            });
          }
        }
      }
    } else if (type === 'sign-out') {
      if (!data) return res.status(400).json({ error: 'Missing "data" for sign-out notification.' });
      const signOutData = data as SignOutEmailData;
      const prog = signOutData.programme ? ` - ${signOutData.programme}` : '';
      subject = `[Sign Out & Evaluation] ${signOutData.delegateName} (${signOutData.studentNumber})${prog}`;
      html = generateSignOutEmailHtml(signOutData);
      text = generateSignOutEmailText(signOutData);

      if (data.idPhotoUrl) {
        if (data.idPhotoUrl.startsWith('http')) {
          attachments.push({
            filename: `ID-${data.studentNumber || 'document'}.jpg`,
            path: data.idPhotoUrl,
          });
        } else if (data.idPhotoUrl.startsWith('data:')) {
          const base64Part = data.idPhotoUrl.split(',')[1];
          if (base64Part) {
            attachments.push({
              filename: `ID-${data.studentNumber || 'document'}.jpg`,
              content: base64Part,
            });
          }
        }
      }
    } else {
      return res.status(400).json({ error: `Invalid notification type: "${type}".` });
    }

    console.log(`[send-email API] Dispatching ${type} to ${toRecipients.length} recipients individually.`);

    // Send 1-to-1 individual emails to each recipient to avoid batch spam flags & ensure individual delivery tracking
    const results = await Promise.allSettled(
      toRecipients.map(async (recipient) => {
        const payload: any = {
          from: fromSender,
          to: [recipient],
          subject,
          html,
          text,
          reply_to: process.env.REPLY_TO_EMAIL || 'info@nti.edu.za',
          headers: {
            'X-Entity-Ref-ID': `nti-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            'Auto-Submitted': 'auto-generated',
          },
        };

        if (attachments.length > 0) {
          payload.attachments = attachments;
        }

        const resendRes = await resend.emails.send(payload);

        if (resendRes.error) {
          console.warn(`[send-email API] Resend error for ${recipient}:`, resendRes.error);
          return {
            recipient,
            success: false,
            error: resendRes.error.message || 'Unknown Resend error',
            name: resendRes.error.name,
          };
        }

        return {
          recipient,
          success: true,
          id: resendRes.data?.id,
        };
      })
    );

    const dispatchSummary = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      return {
        recipient: toRecipients[i],
        success: false,
        error: r.reason?.message || 'Promise rejection',
      };
    });

    const successCount = dispatchSummary.filter((d) => d.success).length;
    console.log(`[send-email API] Dispatched ${successCount}/${toRecipients.length} successfully.`);

    return res.status(successCount > 0 ? 200 : 500).json({
      success: successCount > 0,
      total: toRecipients.length,
      successCount,
      sender: fromSender,
      dispatches: dispatchSummary,
    });
  } catch (error: any) {
    console.error('[send-email API] Internal server error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to process email dispatch request.' });
  }
}
