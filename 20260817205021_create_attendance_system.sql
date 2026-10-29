/*
# Create NTI attendance system data and storage

1. New Tables
- `students` stores the student profile, unique student number, phone number, and public ID photo URL.
- `attendance` stores each daily sign-in/sign-out event linked to a student.

2. Columns
- `students.id` unique UUID identifier.
- `students.first_name`, `last_name`, `student_number`, `phone`, `id_photo_url`, `created_at` profile fields.
- `attendance.id` unique UUID identifier.
- `attendance.student_id` links each attendance record to `students`.
- `attendance.attendance_date`, `time_in`, `time_out`, `status`, `created_at` track the visit.

3. Security
- Row-level security is enabled on both tables.
- This is a shared, no-login attendance kiosk, so anon and authenticated roles receive the four explicit CRUD policies needed by the application.
- The `student-ids` public bucket stores readable identification images. Storage policies allow the app to upload, read, update, and delete objects in that bucket.

4. Integrity and performance
- Student numbers are unique.
- A partial unique index prevents a second active sign-in for the same student on the same date.
- Lookup and dashboard columns are indexed.
*/

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  student_number text NOT NULL UNIQUE,
  phone text,
  id_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  time_in timestamptz NOT NULL DEFAULT now(),
  time_out timestamptz,
  status text NOT NULL DEFAULT 'Signed In' CHECK (status IN ('Signed In', 'Signed Out')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendance_date_idx ON public.attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS attendance_student_idx ON public.attendance(student_id, attendance_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_active_student_date_idx ON public.attendance(student_id, attendance_date) WHERE status = 'Signed In';

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read students" ON public.students;
CREATE POLICY "Public can read students" ON public.students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create students" ON public.students;
CREATE POLICY "Public can create students" ON public.students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update students" ON public.students;
CREATE POLICY "Public can update students" ON public.students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete students" ON public.students;
CREATE POLICY "Public can delete students" ON public.students FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can read attendance" ON public.attendance;
CREATE POLICY "Public can read attendance" ON public.attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create attendance" ON public.attendance;
CREATE POLICY "Public can create attendance" ON public.attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update attendance" ON public.attendance;
CREATE POLICY "Public can update attendance" ON public.attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete attendance" ON public.attendance;
CREATE POLICY "Public can delete attendance" ON public.attendance FOR DELETE TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-ids', 'student-ids', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can upload student IDs" ON storage.objects;
CREATE POLICY "Public can upload student IDs" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'student-ids');
DROP POLICY IF EXISTS "Public can read student IDs" ON storage.objects;
CREATE POLICY "Public can read student IDs" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'student-ids');
DROP POLICY IF EXISTS "Public can update student IDs" ON storage.objects;
CREATE POLICY "Public can update student IDs" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'student-ids') WITH CHECK (bucket_id = 'student-ids');
DROP POLICY IF EXISTS "Public can delete student IDs" ON storage.objects;
CREATE POLICY "Public can delete student IDs" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'student-ids');