-- Ensure all ON CONFLICT columns are unique or primary key
ALTER TABLE user_roles ADD CONSTRAINT unique_role_name UNIQUE (role_name);
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE test_categories ADD CONSTRAINT unique_category_name UNIQUE (category_name);
ALTER TABLE tests ADD CONSTRAINT unique_test_code UNIQUE (test_code);
ALTER TABLE payment_methods ADD CONSTRAINT unique_method_name UNIQUE (method_name);
ALTER TABLE notification_templates ADD CONSTRAINT unique_template_name UNIQUE (template_name);
