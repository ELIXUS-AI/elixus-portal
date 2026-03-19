-- Migration: Replace single current_phase integer with 5 independent boolean phase columns
-- This allows each implementation step to be completed independently

-- Add individual phase completion columns
ALTER TABLE portal_system_status
  ADD COLUMN IF NOT EXISTS phase_1_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_2_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_3_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_4_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_5_complete BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data from current_phase to boolean columns
-- If current_phase = N, phases 1..N-1 are complete
UPDATE portal_system_status SET
  phase_1_complete = (current_phase > 1),
  phase_2_complete = (current_phase > 2),
  phase_3_complete = (current_phase > 3),
  phase_4_complete = (current_phase > 4),
  phase_5_complete = (current_phase >= 5);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
