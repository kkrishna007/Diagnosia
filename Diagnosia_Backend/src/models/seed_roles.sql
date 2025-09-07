-- Seed essential roles for Diagnosia
INSERT INTO user_roles (role_name, role_description)
VALUES
('patient', 'Patient portal user'),
('sample_collector', 'Field collection staff'),
('lab_technician', 'Performs tests in the lab'),
('lab_manager', 'Manages lab operations'),
('admin', 'System administrator')
ON CONFLICT (role_name) DO NOTHING;
