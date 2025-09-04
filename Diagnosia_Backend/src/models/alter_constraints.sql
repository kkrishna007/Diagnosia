-- Add unique constraint on user_roles.role_name if missing
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_role_name' AND rel.relname = 'user_roles'
	) THEN
		ALTER TABLE user_roles ADD CONSTRAINT unique_role_name UNIQUE (role_name);
	END IF;
END $$;

-- Backfill report_time_hours for known tests where NULL
UPDATE tests SET report_time_hours = 24
WHERE report_time_hours IS NULL AND test_code IN ('CBC','LIPID','THYROID','DIABPKG','LFT','KFT','URINE','IRON');

UPDATE tests SET report_time_hours = 48
WHERE report_time_hours IS NULL AND test_code IN ('VITD');

UPDATE tests SET report_time_hours = 72
WHERE report_time_hours IS NULL AND test_code IN ('HEALTHPKG');

-- Backfill fasting_hours where fasting_required is true and fasting_hours is NULL
UPDATE tests SET fasting_hours = 12
WHERE fasting_required = TRUE AND fasting_hours IS NULL AND test_code IN ('LIPID','HEALTHPKG');

UPDATE tests SET fasting_hours = 8
WHERE fasting_required = TRUE AND fasting_hours IS NULL AND test_code IN ('DIABPKG');

-- Add unique constraint on users.email if missing
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_email' AND rel.relname = 'users'
	) THEN
		ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);
	END IF;
END $$;

-- Add unique constraint on test_categories.category_name if missing
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_category_name' AND rel.relname = 'test_categories'
	) THEN
		ALTER TABLE test_categories ADD CONSTRAINT unique_category_name UNIQUE (category_name);
	END IF;
END $$;

-- Use this file to alter constraints or add new columns safely.
-- Add report_time_hours column to tests if it doesn't exist
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name='tests' AND column_name='report_time_hours'
	) THEN
		ALTER TABLE tests ADD COLUMN report_time_hours INTEGER;
	END IF;
END $$;
-- Add unique constraint on tests.test_code if missing (redundant if PK exists, but safe)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_test_code' AND rel.relname = 'tests'
	) THEN
		ALTER TABLE tests ADD CONSTRAINT unique_test_code UNIQUE (test_code);
	END IF;
END $$;

-- Add unique constraint on payment_methods.method_name if missing
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_method_name' AND rel.relname = 'payment_methods'
	) THEN
		ALTER TABLE payment_methods ADD CONSTRAINT unique_method_name UNIQUE (method_name);
	END IF;
END $$;

-- Add unique constraint on notification_templates.template_name if missing
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE con.conname = 'unique_template_name' AND rel.relname = 'notification_templates'
	) THEN
		ALTER TABLE notification_templates ADD CONSTRAINT unique_template_name UNIQUE (template_name);
	END IF;
END $$;
