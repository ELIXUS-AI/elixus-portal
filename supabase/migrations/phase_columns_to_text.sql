-- Migration: Change phase columns from boolean to text for 3-state tracking
-- Values: 'pending' | 'in_progress' | 'complete'

ALTER TABLE portal_system_status
  ALTER COLUMN phase_1_complete TYPE text USING CASE WHEN phase_1_complete THEN 'complete' ELSE 'pending' END,
  ALTER COLUMN phase_2_complete TYPE text USING CASE WHEN phase_2_complete THEN 'complete' ELSE 'pending' END,
  ALTER COLUMN phase_3_complete TYPE text USING CASE WHEN phase_3_complete THEN 'complete' ELSE 'pending' END,
  ALTER COLUMN phase_4_complete TYPE text USING CASE WHEN phase_4_complete THEN 'complete' ELSE 'pending' END,
  ALTER COLUMN phase_5_complete TYPE text USING CASE WHEN phase_5_complete THEN 'complete' ELSE 'pending' END;

ALTER TABLE portal_system_status
  ALTER COLUMN phase_1_complete SET DEFAULT 'pending',
  ALTER COLUMN phase_2_complete SET DEFAULT 'pending',
  ALTER COLUMN phase_3_complete SET DEFAULT 'pending',
  ALTER COLUMN phase_4_complete SET DEFAULT 'pending',
  ALTER COLUMN phase_5_complete SET DEFAULT 'pending';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
