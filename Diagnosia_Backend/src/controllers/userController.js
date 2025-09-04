import pool from '../../config/db.js';

// Get all appointments for the logged-in user
export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await pool.query(
      `SELECT a.*, ua.address
       FROM appointments a
       LEFT JOIN user_addresses ua ON a.collection_address_id = ua.address_id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user.user_id]
    );
    res.json(appointments.rows);
  } catch (err) {
    next(err);
  }
};

// Get all test results for the logged-in user
export const getTestResults = async (req, res, next) => {
  try {
    const results = await pool.query(
      `SELECT tr.*, t.test_name, t.test_code, s.sample_code, at.appointment_id
       FROM test_results tr
       JOIN samples s ON tr.sample_id = s.sample_id
       JOIN appointment_tests at ON s.appointment_test_id = at.appointment_test_id
       JOIN tests t ON tr.test_code = t.test_code
       JOIN appointments a ON at.appointment_id = a.appointment_id
       WHERE a.patient_id = $1
       ORDER BY tr.processed_at DESC`,
      [req.user.user_id]
    );
    res.json(results.rows);
  } catch (err) {
    next(err);
  }
};

// Get current user's profile
export const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, phone, date_of_birth, gender, is_active, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, date_of_birth, gender } = req.body;
    const updated = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, gender = $5, updated_at = NOW()
       WHERE user_id = $6 RETURNING user_id, email, first_name, last_name, phone, date_of_birth, gender, is_active, created_at` ,
      [first_name, last_name, phone, date_of_birth, gender, req.user.user_id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
};
