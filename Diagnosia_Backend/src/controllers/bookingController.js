import pool from '../../config/db.js';

// Create a new appointment and appointment_test
export const createBooking = async (req, res, next) => {
  try {
    const { test_code, appointment_date, appointment_time, appointment_type, collection_address_id, patient_name, patient_age, patient_gender, special_instructions } = req.body;
    // Calculate price from test
    const testRes = await pool.query('SELECT base_price FROM tests WHERE test_code = $1', [test_code]);
    if (testRes.rows.length === 0) return res.status(400).json({ message: 'Test not found' });
    const test_price = testRes.rows[0].base_price;
    // Create appointment
    const apptRes = await pool.query(
      `INSERT INTO appointments (patient_id, appointment_date, appointment_time, appointment_type, collection_address_id, status, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, 'booked', $6, $7)
       RETURNING *`,
      [req.user.user_id, appointment_date, appointment_time, appointment_type, collection_address_id, test_price, special_instructions]
    );
    const appointment = apptRes.rows[0];
    // Create appointment_test
    const apptTestRes = await pool.query(
      `INSERT INTO appointment_tests (appointment_id, test_code, test_price, patient_name, patient_age, patient_gender, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'booked')
       RETURNING *`,
      [appointment.appointment_id, test_code, test_price, patient_name, patient_age, patient_gender]
    );
    res.status(201).json({ appointment, appointment_test: apptTestRes.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Get all bookings for the logged-in user
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await pool.query(
      `SELECT a.*, at.*, t.test_name
       FROM appointments a
       JOIN appointment_tests at ON a.appointment_id = at.appointment_id
       JOIN tests t ON at.test_code = t.test_code
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user.user_id]
    );
    res.json(bookings.rows);
  } catch (err) {
    next(err);
  }
};

// Get booking by id for the logged-in user
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await pool.query(
      `SELECT a.*, at.*, t.test_name
       FROM appointments a
       JOIN appointment_tests at ON a.appointment_id = at.appointment_id
       JOIN tests t ON at.test_code = t.test_code
       WHERE a.appointment_id = $1 AND a.patient_id = $2`,
      [id, req.user.user_id]
    );
    if (booking.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Cancel a booking (set status to cancelled)
export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE appointments SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW() WHERE appointment_id = $2 AND patient_id = $1`,
      [req.user.user_id, id]
    );
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    next(err);
  }
};

// Get available slots for a test (dummy logic, replace with real logic as needed)
export const getAvailableSlots = async (req, res, next) => {
  try {
    // In real app, check for already booked slots for the test and return available ones
    const slots = [
      { date: '2025-08-30', time: '09:00:00' },
      { date: '2025-08-30', time: '10:00:00' },
      { date: '2025-08-30', time: '11:00:00' },
    ];
    res.json(slots);
  } catch (err) {
    next(err);
  }
};
