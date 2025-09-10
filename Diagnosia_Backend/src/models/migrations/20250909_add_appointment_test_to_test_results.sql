-- Migration: add appointment_test_id FK to test_results and optional test_panels table
-- Run this manually against the database when ready.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='test_results' AND column_name='appointment_test_id') THEN
    ALTER TABLE test_results ADD COLUMN appointment_test_id INTEGER REFERENCES appointment_tests(appointment_test_id);
  END IF;
END$$;

-- Optional: table to persist panel templates for admin editing
CREATE TABLE IF NOT EXISTS test_panels (
  panel_id SERIAL PRIMARY KEY,
  test_code VARCHAR(100) UNIQUE NOT NULL,
  panel_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
