import pool from '../../config/db.js';

// Get all payments for a user
export const getPayments = async (req, res, next) => {
  try {
    const payments = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY paid_at DESC`,
      [req.user.user_id]
    );
    res.json(payments.rows);
  } catch (err) {
    next(err);
  }
};

// Create a new payment record
export const createPayment = async (req, res, next) => {
  try {
    const { appointment_id, amount, payment_method, status, transaction_id } = req.body;
    const result = await pool.query(
      `INSERT INTO payments (user_id, appointment_id, amount, payment_method, status, transaction_id, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [req.user.user_id, appointment_id, amount, payment_method, status, transaction_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Get payment by appointment
export const getPaymentByAppointment = async (req, res, next) => {
  try {
    const { appointment_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM payments WHERE appointment_id = $1 AND user_id = $2`,
      [appointment_id, req.user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
