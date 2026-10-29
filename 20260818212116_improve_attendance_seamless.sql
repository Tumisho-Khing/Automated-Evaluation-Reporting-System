/*
# Improve attendance system for seamless sign-in/out

1. Changes
- Drops the partial unique index that prevented multiple active sign-ins per day. This index was too restrictive — it blocked legitimate re-sign-in after sign-out and could cause race condition errors.
- Adds a new partial unique index that only prevents duplicate *active* sign-ins (status = 'Signed In'), allowing a student to sign in again after signing out.
- Adds an `updated_at` column to attendance records for better tracking.
- Adds a composite index on (student_id, attendance_date, status) for faster sign-out lookups.

2. Security
- No policy changes. Existing RLS policies remain in place.

3. Important notes
- The old index `attendance_active_student_date_idx` is dropped and replaced.
- The new index allows multiple records per student per day, but only one can be 'Signed In' at a time.
- This enables the seamless sign-in → sign-out → sign-in again workflow.
*/

-- Drop the old restrictive unique index
DROP INDEX IF EXISTS public.attendance_active_student_date_idx;

-- Add updated_at column to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- New partial unique index: only one active sign-in per student per day, but allows re-sign-in after sign-out
CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_active_per_day_idx
  ON public.attendance (student_id, attendance_date)
  WHERE status = 'Signed In';

-- Composite index for fast sign-out lookups
CREATE INDEX IF NOT EXISTS attendance_signout_lookup_idx
  ON public.attendance (student_id, attendance_date, status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attendance_updated_at ON public.attendance;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();