import pool from '../../config/db.js';

// Get all appointments for the logged-in user
export const getAppointments = async (req, res, next) => {
  try {
    // Fetch raw data and compute derived fields in JS for portability
    const result = await pool.query(
      `SELECT 
         a.*, 
         at.*, 
         t.test_name, 
         t.report_time_hours,
         t.duration_hours,
         ua.address,
         EXISTS (
           SELECT 1 FROM samples s 
           WHERE s.appointment_test_id = at.appointment_test_id AND s.collected_at IS NOT NULL
         ) as has_sample_collected
       FROM appointments a
       JOIN appointment_tests at ON a.appointment_id = at.appointment_id
       JOIN tests t ON at.test_code = t.test_code
       LEFT JOIN user_addresses ua ON a.collection_address_id = ua.address_id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user.user_id]
    );

    const rows = result.rows.map(r => {
      // status label
      let status_label = r.status;
      if (r.has_sample_collected) status_label = 'sample_collected';
      else if (r.status === 'booked') status_label = 'confirmed';
      // estimated completion
      let estimated_completion = null;
      try {
        if (r.appointment_date && r.appointment_time) {
          const dateStr = typeof r.appointment_date === 'string' ? r.appointment_date : new Date(r.appointment_date).toISOString().slice(0,10);
          const timeStr = String(r.appointment_time).slice(0,8);
          const dt = new Date(`${dateStr}T${timeStr}`);
          const addHours = Number(r.report_time_hours ?? r.duration_hours ?? 24);
          if (!isNaN(dt) && !isNaN(addHours)) {
            dt.setHours(dt.getHours() + addHours);
            estimated_completion = dt.toISOString();
          }
        }
      } catch {}

      return { ...r, status_label, estimated_completion };
    });

    res.json(rows);
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
