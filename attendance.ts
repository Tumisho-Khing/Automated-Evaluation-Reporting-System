import { supabase, isSupabaseConfigured } from './supabase';

export type Student = {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  phone: string | null;
  id_photo_url: string | null;
  programme: string | null;
  facilitator: string | null;
  email: string | null;
  cell_phone: string | null;
  work_tel: string | null;
  further_studies: string | null;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  attendance_date: string;
  time_in: string;
  time_out: string | null;
  status: 'Signed In' | 'Signed Out';
  created_at: string;
  updated_at: string;
  programme: string | null;
  facilitator: string | null;
  cell_phone: string | null;
  work_tel: string | null;
  further_studies: string | null;
  course_ratings: number[] | null;
  facilitator_ratings: number[] | null;
  journey_ratings: number[] | null;
  course_comments: string | null;
  facilitator_comments: string | null;
  journey_comments: string | null;
  students: Student;
};

export type StudentWithHistory = Student & {
  attendance: Omit<AttendanceRecord, 'students'>[];
};

export const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem('nti_students_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStudent(student: Student) {
  try {
    const current = getLocalStudents();
    const index = current.findIndex(
      (s) => s.student_number.toLowerCase() === student.student_number.toLowerCase() || s.id === student.id
    );
    if (index >= 0) {
      current[index] = { ...current[index], ...student };
    } else {
      current.push(student);
    }
    localStorage.setItem('nti_students_v1', JSON.stringify(current));
  } catch (e) {
    console.warn('Could not save student to localStorage:', e);
  }
}

function getLocalAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem('nti_attendance_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAttendance(record: AttendanceRecord) {
  try {
    const current = getLocalAttendance();
    const index = current.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      current[index] = { ...current[index], ...record };
    } else {
      current.unshift(record);
    }
    localStorage.setItem('nti_attendance_v1', JSON.stringify(current));
  } catch (e) {
    console.warn('Could not save attendance to localStorage:', e);
  }
}

function buildFurtherStudies(flags: {
  partTime: boolean;
  fullTime: boolean;
  softSkills: boolean;
  businessCourses: boolean;
}) {
  const parts: string[] = [];
  if (flags.partTime) parts.push('Part-time');
  if (flags.fullTime) parts.push('Full-time');
  if (flags.softSkills) parts.push('Soft-skills');
  if (flags.businessCourses) parts.push('Business & Management');
  return parts.length ? parts.join(', ') : '';
}

export async function findStudent(studentNumber: string): Promise<Student | null> {
  const num = studentNumber.trim();
  if (!num) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .ilike('student_number', num)
        .maybeSingle();
      if (!error && data) return data as Student;
      if (error) console.warn('Supabase findStudent note:', error.message);
    } catch (e) {
      console.warn('Supabase findStudent error:', e);
    }
  }

  const local = getLocalStudents();
  return local.find((s) => s.student_number.toLowerCase() === num.toLowerCase()) || null;
}

/**
 * Compresses an image file on the client side to avoid huge payloads and speed up uploads.
 */
async function compressImageFile(file: File, maxDimension = 1200, quality = 0.8): Promise<File> {
  // If not an image or already small (< 100KB), return as is
  if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = (e.target?.result as string) || '';
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function uploadId(file: File, studentNumber: string): Promise<string> {
  const compressed = await compressImageFile(file);

  if (isSupabaseConfigured()) {
    try {
      const extension = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${studentNumber.trim()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
      const { data: uploadData, error } = await supabase.storage
        .from('student-ids')
        .upload(path, compressed, { contentType: compressed.type || 'image/jpeg', upsert: true });

      if (!error && uploadData) {
        const { data } = supabase.storage.from('student-ids').getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      } else if (error) {
        console.warn('Supabase storage upload note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase storage upload error, using local Data URL fallback:', e);
    }
  }

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.readAsDataURL(compressed);
  });
}

export const DEFAULT_NOTIFICATION_EMAILS = [
  'maphallaamari@gmail.com',
  'bradleym@nti.edu.za',
  'lindadv@ngi.ac.za',
];

export function getNotificationEmails(): string[] {
  try {
    const raw = localStorage.getItem('nti_notification_emails');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_NOTIFICATION_EMAILS;
}

export function saveNotificationEmails(emails: string[]): void {
  try {
    const clean = emails.map((e) => e.trim()).filter((e) => e && e.includes('@'));
    localStorage.setItem('nti_notification_emails', JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save notification emails to localStorage:', err);
  }
}

export async function sendAttendanceNotification(
  type: 'sign-in' | 'sign-out' | 'test',
  data: Record<string, any>,
  recipients?: string[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const targetRecipients = recipients && recipients.length > 0 ? recipients : getNotificationEmails();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        recipients: targetRecipients,
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[Notification] Failed to send attendance email:', result);
      return { success: false, error: result.error || 'Failed to dispatch email' };
    }

    console.log('[Notification] Email dispatched successfully:', result);
    return { success: true, data: result };
  } catch (e: any) {
    console.error('[Notification] Error calling /api/send-email endpoint:', e);
    return { success: false, error: e?.message || 'Network error calling email service' };
  }
}

export async function testEmailDelivery(
  testEmail?: string,
  recipients?: string[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const targetRecipients = testEmail
      ? [testEmail]
      : recipients && recipients.length > 0
      ? recipients
      : getNotificationEmails();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test',
        recipients: targetRecipients,
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result.error || 'Test email failed', data: result };
    }
    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error during test' };
  }
}

export async function resendAttendanceRecordNotification(
  record: AttendanceRecord
): Promise<{ success: boolean; error?: string; data?: any }> {
  const student = record.students;
  if (!student) {
    return { success: false, error: 'Student information missing for this record.' };
  }

  const isSignOut = record.status === 'Signed Out' || Boolean(record.time_out);

  if (isSignOut) {
    return await sendAttendanceNotification('sign-out', {
      delegateName: `${student.first_name} ${student.last_name}`,
      studentNumber: student.student_number,
      programme: record.programme || student.programme,
      facilitator: record.facilitator || student.facilitator,
      cellPhone: record.cell_phone || student.cell_phone,
      workTel: record.work_tel || student.work_tel,
      email: student.email,
      trainingDate: record.attendance_date,
      timeIn: record.time_in,
      timeOut: record.time_out,
      furtherStudies: record.further_studies || student.further_studies,
      courseRatings: record.course_ratings,
      facilitatorRatings: record.facilitator_ratings,
      journeyRatings: record.journey_ratings,
      courseComments: record.course_comments,
      facilitatorComments: record.facilitator_comments,
      journeyComments: record.journey_comments,
      idPhotoUrl: student.id_photo_url,
    });
  } else {
    return await sendAttendanceNotification('sign-in', {
      delegateName: `${student.first_name} ${student.last_name}`,
      studentNumber: student.student_number,
      programme: record.programme || student.programme,
      facilitator: record.facilitator || student.facilitator,
      cellPhone: record.cell_phone || student.cell_phone,
      workTel: record.work_tel || student.work_tel,
      email: student.email,
      trainingDate: record.attendance_date,
      timeIn: record.time_in,
      furtherStudies: record.further_studies || student.further_studies,
      idPhotoUrl: student.id_photo_url,
    });
  }
}

export async function signInStudent(input: {
  firstName: string;
  lastName: string;
  studentNumber: string;
  programme: string;
  facilitator: string;
  cellPhone: string;
  workTel: string;
  email: string;
  trainingDate?: string;
  furtherStudies: {
    partTime: boolean;
    fullTime: boolean;
    softSkills: boolean;
    businessCourses: boolean;
  };
  file: File;
}) {
  const studentNumber = input.studentNumber.trim();
  const attendanceDate = input.trainingDate?.trim() || today();
  const furtherStudies = buildFurtherStudies(input.furtherStudies);
  const now = new Date().toISOString();

  const photoUrl = await uploadId(input.file, studentNumber);

  const existingStudent: Student | null = await findStudent(studentNumber);

  const studentPayload = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    student_number: studentNumber,
    phone: input.cellPhone.trim() || null,
    id_photo_url: photoUrl,
    programme: input.programme.trim() || null,
    facilitator: input.facilitator.trim() || null,
    email: input.email.trim() || null,
    cell_phone: input.cellPhone.trim() || null,
    work_tel: input.workTel.trim() || null,
    further_studies: furtherStudies || null,
    created_at: existingStudent?.created_at || now,
  };

  let savedStudent: Student | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert(
          existingStudent?.id
            ? { id: existingStudent.id, ...studentPayload }
            : { ...studentPayload },
          { onConflict: 'student_number' }
        )
        .select('*')
        .single();
      if (!error && data) {
        savedStudent = data as Student;
      } else if (error) {
        console.error('Supabase upsert student error:', error.message, error.details);
        throw new Error(`Database error saving student: ${error.message}`);
      }
    } catch (e) {
      console.warn('Supabase upsert student error:', e);
      throw e;
    }
  }

  if (!savedStudent) {
    savedStudent = {
      id: existingStudent?.id || crypto.randomUUID(),
      ...studentPayload,
    };
  }
  saveLocalStudent(savedStudent);

  // Check for existing active sign-in record on this date to prevent duplicates
  let existingActiveAttendance: AttendanceRecord | null = null;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(*)')
        .eq('student_id', savedStudent.id)
        .eq('attendance_date', attendanceDate)
        .eq('status', 'Signed In')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        existingActiveAttendance = data as AttendanceRecord;
      }
    } catch (e) {
      console.warn('Supabase duplicate signin check warning:', e);
    }
  }

  if (!existingActiveAttendance) {
    const localAtt = getLocalAttendance();
    existingActiveAttendance =
      localAtt.find(
        (r) =>
          r.student_id === savedStudent!.id &&
          r.attendance_date === attendanceDate &&
          r.status === 'Signed In'
      ) || null;
  }

  let savedAttendance: AttendanceRecord | null = null;

  if (existingActiveAttendance) {
    // Student already signed in today — update latest details without duplicating row
    const updateExistingPayload = {
      updated_at: now,
      programme: input.programme.trim() || existingActiveAttendance.programme,
      facilitator: input.facilitator.trim() || existingActiveAttendance.facilitator,
      cell_phone: input.cellPhone.trim() || existingActiveAttendance.cell_phone,
      work_tel: input.workTel.trim() || existingActiveAttendance.work_tel,
      further_studies: furtherStudies || existingActiveAttendance.further_studies,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update(updateExistingPayload)
          .eq('id', existingActiveAttendance.id)
          .select('*, students(*)')
          .single();
        if (!error && data) {
          savedAttendance = data as AttendanceRecord;
        }
      } catch (e) {
        console.warn('Supabase update active attendance note:', e);
      }
    }

    if (!savedAttendance) {
      savedAttendance = {
        ...existingActiveAttendance,
        ...updateExistingPayload,
        students: savedStudent,
      };
    }
  } else {
    // Create new attendance record
    const attendancePayload = {
      student_id: savedStudent.id,
      attendance_date: attendanceDate,
      time_in: now,
      time_out: null,
      status: 'Signed In' as const,
      created_at: now,
      updated_at: now,
      programme: input.programme.trim() || null,
      facilitator: input.facilitator.trim() || null,
      cell_phone: input.cellPhone.trim() || null,
      work_tel: input.workTel.trim() || null,
      further_studies: furtherStudies || null,
      course_ratings: null,
      facilitator_ratings: null,
      journey_ratings: null,
      course_comments: null,
      facilitator_comments: null,
      journey_comments: null,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert(attendancePayload)
          .select('*, students(*)')
          .single();
        if (!error && data) {
          savedAttendance = data as AttendanceRecord;
        } else if (error) {
          console.error('Supabase insert attendance error:', error.message, error.details);
          throw new Error(`Database error saving attendance: ${error.message}`);
        }
      } catch (e) {
        console.warn('Supabase insert attendance error:', e);
        throw e;
      }
    }

    if (!savedAttendance) {
      savedAttendance = {
        id: crypto.randomUUID(),
        ...attendancePayload,
        students: savedStudent,
      };
    }
  }
  saveLocalAttendance(savedAttendance);

  // Dispatch notification email before returning
  try {
    await sendAttendanceNotification('sign-in', {
      delegateName: `${savedStudent.first_name} ${savedStudent.last_name}`,
      studentNumber: savedStudent.student_number,
      programme: savedAttendance.programme,
      facilitator: savedAttendance.facilitator,
      cellPhone: savedStudent.cell_phone,
      workTel: savedStudent.work_tel,
      email: savedStudent.email,
      trainingDate: savedAttendance.attendance_date,
      timeIn: savedAttendance.time_in,
      furtherStudies: savedAttendance.further_studies,
      idPhotoUrl: savedStudent.id_photo_url,
    });
  } catch (err) {
    console.warn('[Attendance] Error during sign-in notification dispatch:', err);
  }

  return {
    student: savedStudent,
    attendance: savedAttendance,
  };
}

export async function signOutStudent(
  studentNumber: string,
  evaluation?: {
    candidateName?: string;
    programme: string;
    facilitator: string;
    venue?: string;
    cellPhone: string;
    workTel: string;
    furtherStudies: {
      partTime: boolean;
      fullTime: boolean;
      softSkills: boolean;
      businessCourses: boolean;
    };
    courseRatings: number[];
    facilitatorRatings: number[];
    journeyRatings: number[];
    courseComments: string;
    facilitatorComments: string;
    journeyComments: string;
  }
) {

  const sNum = studentNumber.trim();
  let student = await findStudent(sNum);

  const now = new Date().toISOString();
  const attendanceDate = today();

  if (!student) {
    const rawName = evaluation?.candidateName?.trim() || '';
    const names = rawName ? rawName.split(' ') : [sNum];
    const firstName = names[0] || sNum;
    const lastName = names.slice(1).join(' ') || 'Student';

    student = {
      id: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
      student_number: sNum,
      phone: evaluation?.cellPhone.trim() || null,
      id_photo_url: null,
      programme: evaluation?.programme.trim() || null,
      facilitator: evaluation?.facilitator.trim() || null,
      email: null,
      cell_phone: evaluation?.cellPhone.trim() || null,
      work_tel: evaluation?.workTel.trim() || null,
      further_studies: evaluation ? buildFurtherStudies(evaluation.furtherStudies) || null : null,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('students').upsert(student, { onConflict: 'student_number' });
      } catch (e) {
        console.warn('Supabase create student during signout error:', e);
      }
    }
    saveLocalStudent(student);
  }

  let activeRecord: AttendanceRecord | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(*)')
        .eq('student_id', student.id)
        .eq('status', 'Signed In')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) activeRecord = data as AttendanceRecord;
    } catch (e) {
      console.warn('Supabase lookup active signout error:', e);
    }
  }

  if (!activeRecord) {
    const localAtt = getLocalAttendance();
    activeRecord =
      localAtt.find(
        (r) =>
          (r.student_id === student?.id || r.students?.student_number?.toLowerCase() === sNum.toLowerCase()) &&
          r.status === 'Signed In'
      ) || null;
  }

  const furtherStudies = evaluation ? buildFurtherStudies(evaluation.furtherStudies) : '';

  const updatePayload = {
    time_out: now,
    status: 'Signed Out' as const,
    updated_at: now,
    programme: evaluation?.programme.trim() || activeRecord?.programme || student.programme || null,
    facilitator: evaluation?.facilitator.trim() || activeRecord?.facilitator || student.facilitator || null,
    cell_phone: evaluation?.cellPhone.trim() || activeRecord?.cell_phone || student.cell_phone || null,
    work_tel: evaluation?.workTel.trim() || activeRecord?.work_tel || student.work_tel || null,
    further_studies: furtherStudies || activeRecord?.further_studies || student.further_studies || null,
    course_ratings: evaluation?.courseRatings || null,
    facilitator_ratings: evaluation?.facilitatorRatings || null,
    journey_ratings: evaluation?.journeyRatings || null,
    course_comments: evaluation?.courseComments.trim() || null,
    facilitator_comments: evaluation?.facilitatorComments.trim() || null,
    journey_comments: evaluation?.journeyComments.trim() || null,
  };

  let updatedRecord: AttendanceRecord | null = null;

  if (activeRecord) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update(updatePayload)
          .eq('id', activeRecord.id)
          .select('*, students(*)')
          .single();
        if (!error && data) {
          updatedRecord = data as AttendanceRecord;
        } else if (error) {
          console.error('Supabase update signout error:', error.message);
          throw new Error(`Database error updating sign out: ${error.message}`);
        }
      } catch (e) {
        console.warn('Supabase update signout network error:', e);
        throw e;
      }
    }

    if (!updatedRecord) {
      updatedRecord = {
        ...activeRecord,
        ...updatePayload,
        students: student,
      };
    }
  } else {
    const attendanceDbPayload = {
      student_id: student.id,
      attendance_date: attendanceDate,
      time_in: now,
      ...updatePayload,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert(attendanceDbPayload)
          .select('*, students(*)')
          .single();
        if (!error && data) {
          updatedRecord = data as AttendanceRecord;
        } else if (error) {
          console.error('Supabase insert new signout record error:', error.message);
          throw new Error(`Database error recording sign out: ${error.message}`);
        }
      } catch (e) {
        console.warn('Supabase insert new signout record network error:', e);
        throw e;
      }
    }

    if (!updatedRecord) {
      updatedRecord = {
        id: crypto.randomUUID(),
        ...attendanceDbPayload,
        students: student,
      };
    }
  }

  saveLocalAttendance(updatedRecord);

  // Dispatch notification email before returning
  try {
    await sendAttendanceNotification('sign-out', {
      delegateName: `${student.first_name} ${student.last_name}`,
      studentNumber: student.student_number,
      programme: updatedRecord.programme,
      facilitator: updatedRecord.facilitator,
      venue: evaluation?.venue || null,
      cellPhone: updatedRecord.cell_phone,
      workTel: updatedRecord.work_tel,
      email: student.email,
      trainingDate: updatedRecord.attendance_date,
      timeIn: updatedRecord.time_in,
      timeOut: updatedRecord.time_out,
      furtherStudies: updatedRecord.further_studies,
      courseRatings: updatedRecord.course_ratings,
      facilitatorRatings: updatedRecord.facilitator_ratings,
      journeyRatings: updatedRecord.journey_ratings,
      courseComments: updatedRecord.course_comments,
      facilitatorComments: updatedRecord.facilitator_comments,
      journeyComments: updatedRecord.journey_comments,
      idPhotoUrl: student.id_photo_url,
    });
  } catch (err) {
    console.warn('[Attendance] Error during sign-out notification dispatch:', err);
  }

  return {
    student,
    attendance: updatedRecord,
  };
}

export async function listAttendance(): Promise<AttendanceRecord[]> {
  let supabaseRecords: AttendanceRecord[] = [];
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(*)')
        .order('attendance_date', { ascending: false })
        .order('time_in', { ascending: false });
      if (!error && data) {
        supabaseRecords = data as AttendanceRecord[];
      } else if (error) {
        console.warn('Supabase listAttendance note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase listAttendance error:', e);
    }
  }

  const localRecords = getLocalAttendance();
  const map = new Map<string, AttendanceRecord>();
  localRecords.forEach((r) => map.set(r.id, r));
  supabaseRecords.forEach((r) => map.set(r.id, r));

  const combined = Array.from(map.values());
  combined.sort(
    (a, b) => new Date(b.created_at || b.time_in).getTime() - new Date(a.created_at || a.time_in).getTime()
  );
  return combined;
}

export async function lookupStudent(query: string): Promise<StudentWithHistory | null> {
  const term = query.trim().toLowerCase();
  if (!term) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, attendance(*)')
        .or(`student_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as StudentWithHistory;
      if (error) console.warn('Supabase lookupStudent note:', error.message);
    } catch (e) {
      console.warn('Supabase lookupStudent error:', e);
    }
  }

  const localStudents = getLocalStudents();
  const student =
    localStudents.find(
      (s) =>
        s.student_number.toLowerCase().includes(term) ||
        s.first_name.toLowerCase().includes(term) ||
        s.last_name.toLowerCase().includes(term) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(term)
    ) || null;

  if (!student) return null;

  const allAttendance = getLocalAttendance();
  const studentAtt = allAttendance.filter(
    (r) => r.student_id === student!.id || r.students?.student_number?.toLowerCase() === student!.student_number.toLowerCase()
  );

  return {
    ...student,
    attendance: studentAtt,
  };
}
