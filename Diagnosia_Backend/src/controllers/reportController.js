import pool from '../../config/db.js';

// Get all reports for a user
export const getReports = async (req, res, next) => {
  try {
    const reports = await pool.query(
      `SELECT r.*, a.appointment_date, t.test_name
       FROM reports r
       JOIN appointments a ON r.appointment_id = a.appointment_id
       JOIN appointment_tests at ON a.appointment_id = at.appointment_id
       JOIN tests t ON at.test_id = t.test_id
       WHERE r.user_id = $1
       ORDER BY r.generated_at DESC`,
      [req.user.user_id]
    );
    res.json(reports.rows);
  } catch (err) {
    next(err);
  }
};

// Get a specific report by report_id
export const getReportById = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const result = await pool.query(
      `SELECT r.*, a.appointment_date, t.test_name
       FROM reports r
       JOIN appointments a ON r.appointment_id = a.appointment_id
       JOIN appointment_tests at ON a.appointment_id = at.appointment_id
       JOIN tests t ON at.test_id = t.test_id
       WHERE r.report_id = $1 AND r.user_id = $2`,
      [report_id, req.user.user_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
