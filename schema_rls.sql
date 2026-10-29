-- =========================================================
-- NTI Sign-In System: Server-Side Row Level Security (RLS)
-- Target Isolation & Data Protection Policies
-- =========================================================

-- 1. Enable RLS on Students table
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

-- Anonymous users (public sign-in / sign-out kiosks) can INSERT / UPSERT student profile data
CREATE POLICY "Allow public anon to insert and update student profile"
  ON public.students
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public anon to upsert student profile"
  ON public.students
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ONLY authenticated users (Admins) can SELECT / query student records
CREATE POLICY "Allow authenticated admins to select students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Enable RLS on Attendance table
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;

-- Anonymous users (public sign-in / sign-out kiosks) can INSERT sign-in and sign-out records
CREATE POLICY "Allow public anon to insert attendance"
  ON public.attendance
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anonymous users can UPDATE attendance record upon sign-out evaluation
CREATE POLICY "Allow public anon to update signout attendance"
  ON public.attendance
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ONLY authenticated users (Admins) can SELECT / query attendance records
CREATE POLICY "Allow authenticated admins to select attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Storage Bucket Policy for `student-ids`
-- Enable RLS on storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public anon to upload student ID photo"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'student-ids');

CREATE POLICY "Allow authenticated admin to view student ID photo"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-ids');
