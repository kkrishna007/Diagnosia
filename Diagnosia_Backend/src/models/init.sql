-- Diagnosia - Complete Database Schema

-- 1. User Management Tables
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_description TEXT
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  user_id INTEGER REFERENCES users(user_id),
  role_id INTEGER REFERENCES user_roles(role_id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_addresses (
  address_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  address VARCHAR(500) NOT NULL
);

-- 2. Test Management Tables
CREATE TABLE IF NOT EXISTS test_categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  category_description TEXT,
  category_icon VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tests (
  test_code VARCHAR(50) PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  test_description TEXT,
  category_id INTEGER REFERENCES test_categories(category_id),
  base_price DECIMAL(10,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  preparation_instructions TEXT,
  sample_type VARCHAR(100) NOT NULL,
  fasting_required BOOLEAN DEFAULT FALSE,
  fasting_hours INTEGER,
  gender_specific VARCHAR(20)
);

-- 3. Appointment Management Tables
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES users(user_id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('lab_visit', 'home_collection')),
  collection_address_id INTEGER REFERENCES user_addresses(address_id),
  status VARCHAR(20) DEFAULT 'booked',
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  cancellation_reason TEXT,
  cancelled_by INTEGER REFERENCES users(user_id),
  cancelled_at TIMESTAMP,
  rescheduled_from INTEGER REFERENCES appointments(appointment_id),
  rescheduled_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_tests (
  appointment_test_id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(appointment_id),
  test_code VARCHAR(50) REFERENCES tests(test_code),
  test_price DECIMAL(10,2) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender VARCHAR(10) NOT NULL CHECK (patient_gender IN ('male', 'female', 'other')),
  status VARCHAR(20) DEFAULT 'booked'
);

-- 4. Sample Management Tables
CREATE TABLE IF NOT EXISTS samples (
  sample_id SERIAL PRIMARY KEY,
  sample_code VARCHAR(50) UNIQUE NOT NULL,
  appointment_test_id INTEGER REFERENCES appointment_tests(appointment_test_id),
  collected_by INTEGER REFERENCES users(user_id),
  collected_at TIMESTAMP,
  collection_method VARCHAR(100),
  sample_quality VARCHAR(20),
  storage_location VARCHAR(100),
  temperature_maintained BOOLEAN DEFAULT TRUE,
  received_by_lab INTEGER REFERENCES users(user_id),
  received_at TIMESTAMP,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'collected',
  rejection_reason TEXT,
  notes TEXT
);

-- 5. Results Management Tables
CREATE TABLE IF NOT EXISTS test_results (
  result_id SERIAL PRIMARY KEY,
  sample_id INTEGER REFERENCES samples(sample_id),
  test_code VARCHAR(50) REFERENCES tests(test_code),
  processed_by INTEGER REFERENCES users(user_id),
  verified_by INTEGER REFERENCES users(user_id),
  result_values JSONB NOT NULL,
  reference_ranges JSONB,
  abnormal_flags JSONB,
  interpretation TEXT,
  recommendations TEXT,
  critical_values BOOLEAN DEFAULT FALSE,
  result_status VARCHAR(20) DEFAULT 'draft',
  processed_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  released_at TIMESTAMP,
  amended_reason TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS test_reports (
  report_id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(appointment_id),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  report_date DATE NOT NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('individual', 'consolidated')),
  report_file_path VARCHAR(500),
  report_file_name VARCHAR(255),
  file_size_kb INTEGER,
  generated_by INTEGER REFERENCES users(user_id),
  approved_by INTEGER REFERENCES users(user_id),
  patient_notified BOOLEAN DEFAULT FALSE,
  patient_downloaded BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  first_downloaded_at TIMESTAMP,
  last_downloaded_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Payment Management Tables
CREATE TABLE IF NOT EXISTS payment_methods (
  method_id SERIAL PRIMARY KEY,
  method_name VARCHAR(100) NOT NULL,
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('online', 'cash', 'card', 'wallet', 'upi')),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  appointment_id INTEGER REFERENCES appointments(appointment_id),
  user_id INTEGER REFERENCES users(user_id),
  payment_method_id INTEGER REFERENCES payment_methods(method_id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_status VARCHAR(20) DEFAULT 'success',
  gateway_response JSONB,
  transaction_id VARCHAR(100),
  completed_at TIMESTAMP DEFAULT NOW(),
  failure_reason TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP
);

-- 7. Notification System Tables
CREATE TABLE IF NOT EXISTS notification_templates (
  template_id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  event_trigger VARCHAR(100) NOT NULL,
  subject_template VARCHAR(500),
  body_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  template_id INTEGER REFERENCES notification_templates(template_id),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(10) DEFAULT 'normal',
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. System Configuration Tables
CREATE TABLE IF NOT EXISTS system_settings (
  setting_id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT FALSE,
  updated_by INTEGER REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  session_id VARCHAR(255)
);

-- 10. Chatbot Support Tables
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  conversation_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  session_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  escalated_to INTEGER REFERENCES users(user_id),
  satisfaction_rating INTEGER,
  feedback TEXT
);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES chatbot_conversations(conversation_id),
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  message_text TEXT NOT NULL,
  intent VARCHAR(100),
  confidence_score DECIMAL(5,4),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
