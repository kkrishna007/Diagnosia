-- Diagnosia - Seed Data

-- 1. User Roles
INSERT INTO user_roles (role_name, role_description) VALUES
  ('admin', 'Administrator'),
  ('patient', 'Patient'),
  ('lab_staff', 'Lab Staff'),
  ('doctor', 'Doctor')
ON CONFLICT (role_name) DO NOTHING;

-- 2. Users
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, gender)
VALUES
  ('admin@diagnosia.com', '$2b$10$adminhash', 'Admin', 'User', '9999999999', '1980-01-01', 'male'),
  ('john.doe@example.com', '$2b$10$johnhash', 'John', 'Doe', '8888888888', '1990-05-15', 'male'),
  ('jane.smith@example.com', '$2b$10$janehash', 'Jane', 'Smith', '7777777777', '1992-08-22', 'female'),
  ('lab.staff@example.com', '$2b$10$labhash', 'Lab', 'Staff', '6666666666', '1985-03-10', 'other')
ON CONFLICT (email) DO NOTHING;

-- 3. User Role Assignments
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, user_roles r
WHERE (u.email = 'admin@diagnosia.com' AND r.role_name = 'admin')
  OR (u.email = 'john.doe@example.com' AND r.role_name = 'patient')
  OR (u.email = 'jane.smith@example.com' AND r.role_name = 'patient')
  OR (u.email = 'lab.staff@example.com' AND r.role_name = 'lab_staff');

-- 4. User Addresses
INSERT INTO user_addresses (user_id, address) VALUES
  ((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), '123 Main St, City'),
  ((SELECT user_id FROM users WHERE email = 'jane.smith@example.com'), '456 Park Ave, City');

-- 5. Test Categories
INSERT INTO test_categories (category_name, category_description, category_icon) VALUES
  ('Blood', 'Blood related tests', 'blood.png'),
  ('Urine', 'Urine related tests', 'urine.png'),
  ('Imaging', 'Imaging/Scan tests', 'imaging.png')
ON CONFLICT (category_name) DO NOTHING;

-- 6. Tests
INSERT INTO tests (test_code, test_name, test_description, category_id, base_price, duration_hours, preparation_instructions, sample_type, fasting_required, fasting_hours, gender_specific) VALUES
  ('CBC', 'Complete Blood Count (CBC)', 'A comprehensive blood test that evaluates your overall health and detects a variety of disorders.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 350, 1, 'No special prep', 'Blood', false, NULL, NULL),
  ('LIPID', 'Lipid Profile', 'Measures cholesterol and triglyceride levels to assess cardiovascular risk.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 450, 1, 'Fasting required', 'Blood', true, NULL, NULL),
  ('THYROID', 'Thyroid Profile (T3, T4, TSH)', 'Comprehensive thyroid function test including T3, T4, and TSH hormones.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 600, 2, 'No special prep', 'Blood', false, NULL, NULL),
  ('DIABPKG', 'Diabetes Package (HbA1c + Glucose)', 'Complete diabetes monitoring package with HbA1c and glucose levels.', (SELECT category_id FROM test_categories WHERE category_name='package'), 800, 1, 'Fasting required', 'Blood', true, NULL, NULL),
  ('LFT', 'Liver Function Test (LFT)', 'Comprehensive liver function assessment including all major enzymes.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 500, 1, 'No alcohol 24h', 'Blood', false, NULL, NULL),
  ('KFT', 'Kidney Function Test (KFT)', 'Complete kidney function evaluation including creatinine and urea.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 400, 1, 'No special prep', 'Blood', false, NULL, NULL),
  ('URINE', 'Urine Routine Examination', 'Complete urine analysis for urinary tract infections and kidney health.', (SELECT category_id FROM test_categories WHERE category_name='Urine'), 200, 1, 'No special prep', 'Urine', false, NULL, NULL),
  ('VITD', 'Vitamin D Test', 'Measures vitamin D levels to assess bone health and immunity.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 1200, 2, 'No special prep', 'Blood', false, NULL, NULL),
  ('HEALTHPKG', 'Complete Health Checkup', 'Comprehensive health package with 50+ parameters for overall health assessment.', (SELECT category_id FROM test_categories WHERE category_name='package'), 2500, 2, 'Fasting required', 'Blood & Urine', true, NULL, NULL),
  ('IRON', 'Iron Deficiency Panel', 'Complete iron studies including ferritin, iron, and TIBC.', (SELECT category_id FROM test_categories WHERE category_name='Blood'), 800, 1, 'No special prep', 'Blood', false, NULL, NULL)
ON CONFLICT (test_code) DO NOTHING;

-- 7. Payment Methods
INSERT INTO payment_methods (method_name, method_type) VALUES
  ('Cash', 'cash'),
  ('Credit Card', 'card'),
  ('UPI', 'upi')
ON CONFLICT (method_name) DO NOTHING;

-- 8. Appointments
INSERT INTO appointments (patient_id, appointment_date, appointment_time, appointment_type, collection_address_id, status, total_amount, special_instructions)
VALUES
  ((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), CURRENT_DATE + INTERVAL '1 day', '09:00', 'lab_visit', NULL, 'booked', 1300, 'N/A'),
  ((SELECT user_id FROM users WHERE email = 'jane.smith@example.com'), CURRENT_DATE + INTERVAL '2 days', '10:30', 'home_collection', (SELECT address_id FROM user_addresses WHERE address LIKE '456%'), 'booked', 800, 'Fasting required');

-- 9. Appointment Tests
INSERT INTO appointment_tests (appointment_id, test_code, test_price, patient_name, patient_age, patient_gender)
SELECT a.appointment_id, 'CBC', 500, 'John Doe', 34, 'male' FROM appointments a WHERE a.patient_id = (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
INSERT INTO appointment_tests (appointment_id, test_code, test_price, patient_name, patient_age, patient_gender)
SELECT a.appointment_id, 'LFT', 800, 'Jane Smith', 32, 'female' FROM appointments a WHERE a.patient_id = (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');

-- 10. Payments
INSERT INTO payments (payment_reference, appointment_id, user_id, payment_method_id, amount)
SELECT 'PAY123', a.appointment_id, a.patient_id, (SELECT method_id FROM payment_methods WHERE method_name='Cash'), 1300 FROM appointments a WHERE a.patient_id = (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
INSERT INTO payments (payment_reference, appointment_id, user_id, payment_method_id, amount)
SELECT 'PAY124', a.appointment_id, a.patient_id, (SELECT method_id FROM payment_methods WHERE method_name='UPI'), 800 FROM appointments a WHERE a.patient_id = (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');

-- 11. Notification Templates
INSERT INTO notification_templates (template_name, event_trigger, subject_template, body_template, variables) VALUES
  ('Booking Confirmation', 'appointment_booked', 'Your booking is confirmed', 'Dear {{name}}, your booking is confirmed for {{date}}.', '{"name":"","date":""}'),
  ('Test Result Ready', 'test_result_ready', 'Your test result is ready', 'Dear {{name}}, your test result for {{test}} is ready.', '{"name":"","test":""}')
ON CONFLICT (template_name) DO NOTHING;

-- 12. Notifications
INSERT INTO notifications (user_id, template_id, subject, message)
SELECT u.user_id, t.template_id, 'Booking Confirmed', 'Your booking is confirmed for tomorrow.'
FROM users u, notification_templates t
WHERE u.email = 'john.doe@example.com' AND t.template_name = 'Booking Confirmation';

-- 13. Chatbot Conversations
INSERT INTO chatbot_conversations (user_id, session_id)
SELECT user_id, 'sess1' FROM users WHERE email = 'john.doe@example.com';

-- 14. Chatbot Messages
INSERT INTO chatbot_messages (conversation_id, sender_type, message_text)
SELECT c.conversation_id, 'user', 'Hello, I need help.' FROM chatbot_conversations c WHERE c.session_id = 'sess1';
INSERT INTO chatbot_messages (conversation_id, sender_type, message_text)
SELECT c.conversation_id, 'bot', 'How can I assist you?' FROM chatbot_conversations c WHERE c.session_id = 'sess1';
