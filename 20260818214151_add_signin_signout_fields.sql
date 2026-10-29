/*
# Add sign-in and sign-out form fields to database

1. Modified Tables
- `students`: adds programme, facilitator, email, cell_phone, work_tel, further_studies columns to store the delegate's profile information captured at sign-in.
- `attendance`: adds programme, facilitator, cell_phone, work_tel, further_studies columns for per-session data, plus evaluation columns for sign-out (course_ratings, facilitator_ratings, journey_ratings as JSONB arrays, and course_comments, facilitator_comments, journey_comments as text).

2. Columns added to `students`
- `programme` (text) — the programme or course the delegate is attending.
- `facilitator` (text) — the facilitator name for the delegate's session.
- `email` (text) — the delegate's email address.
- `cell_phone` (text) — the delegate's cell phone number.
- `work_tel` (text) — the delegate's work telephone number.
- `further_studies` (text) — comma-separated list of further study interests (e.g. "Part-time,Soft-skills").

3. Columns added to `attendance`
- `programme` (text) — programme name for this session.
- `facilitator` (text) — facilitator name for this session.
- `cell_phone` (text) — cell phone captured at sign-in or sign-out.
- `work_tel` (text) — work telephone captured at sign-in or sign-out.
- `further_studies` (text) — further studies preferences.
- `course_ratings` (jsonb) — array of 8 ratings (1-5) for course content questions.
- `facilitator_ratings` (jsonb) — array of 7 ratings (1-5) for facilitator evaluation questions.
- `journey_ratings` (jsonb) — array of 5 ratings (1-5) for learning journey questions.
- `course_comments` (text) — comments on course content.
- `facilitator_comments` (text) — comments on facilitator.
- `journey_comments` (text) — comments on learning journey.

4. Security
- No policy changes. Existing RLS policies remain in place and cover the new columns (all columns are updatable/insertable by anon and authenticated).

5. Important notes
- All additions are additive — no existing columns are dropped or changed, so no data is lost.
- The existing `phone` column on `students` is preserved; `cell_phone` is added as a separate field to match the form.
- JSONB rating arrays allow flexible storage of 1-5 scale responses.
*/

-- Add sign-in profile fields to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS programme text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS facilitator text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cell_phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS work_tel text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS further_studies text;

-- Add session and evaluation fields to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS programme text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS facilitator text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS cell_phone text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS work_tel text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS further_studies text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS course_ratings jsonb;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS facilitator_ratings jsonb;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS journey_ratings jsonb;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS course_comments text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS facilitator_comments text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS journey_comments text;