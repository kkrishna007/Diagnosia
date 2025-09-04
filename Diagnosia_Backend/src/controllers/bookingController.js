import pool from '../../config/db.js';

// Create a new appointment and appointment_test
export const createBooking = async (req, res, next) => {
  try {
    const { test_code, appointment_date, appointment_time, appointment_type, collection_address_id, patient_name, patient_age, patient_gender, special_instructions } = req.body;
    // Calculate price from test
    const testRes = await pool.query('SELECT base_price FROM tests WHERE test_code = $1', [test_code]);
    if (testRes.rows.length === 0) return res.status(400).json({ message: 'Test not found' });
    const test_price = testRes.rows[0].base_price;

    // Fallbacks from user's profile if age/gender/name not provided
    let finalPatientName = patient_name;
    let finalPatientAge = patient_age;
    let finalPatientGender = patient_gender;
    if (!finalPatientName || finalPatientAge == null || !finalPatientGender) {
      const userRes = await pool.query(
        'SELECT first_name, last_name, date_of_birth, gender FROM users WHERE user_id = $1',
        [req.user.user_id]
      );
      if (userRes.rows.length) {
        const u = userRes.rows[0];
        if (!finalPatientName) {
          finalPatientName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Patient';
        }
        if (finalPatientAge == null && u.date_of_birth) {
          const dob = new Date(u.date_of_birth);
          if (!isNaN(dob)) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            finalPatientAge = Math.max(0, age);
          }
        }
        if (!finalPatientGender && u.gender) {
          // Ensure it matches CHECK constraint: 'male','female','other'
          finalPatientGender = String(u.gender).toLowerCase();
        }
      }
    }

    // Guard against nulls for NOT NULL columns
    if (finalPatientAge == null) return res.status(400).json({ message: 'Patient age is required' });
    if (!finalPatientGender) return res.status(400).json({ message: 'Patient gender is required' });

    // Compute total amount incl. home collection surcharge
    const HOME_SURCHARGE = 300;
    const totalAmount = Number(test_price) + (appointment_type === 'home_collection' ? HOME_SURCHARGE : 0);
    // Create appointment
    const apptRes = await pool.query(
      `INSERT INTO appointments (patient_id, appointment_date, appointment_time, appointment_type, collection_address_id, status, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, 'booked', $6, $7)
       RETURNING *`,
  [req.user.user_id, appointment_date, appointment_time, appointment_type, collection_address_id, totalAmount, special_instructions]
    );
    const appointment = apptRes.rows[0];
    // Create appointment_test
    const apptTestRes = await pool.query(
      `INSERT INTO appointment_tests (appointment_id, test_code, test_price, patient_name, patient_age, patient_gender, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'booked')
       RETURNING *`,
  [appointment.appointment_id, test_code, test_price, finalPatientName, finalPatientAge, finalPatientGender]
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
    // Use a transaction to update appointment and related tests
    await pool.query('BEGIN');
    const result = await pool.query(
      `UPDATE appointments 
         SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW() 
       WHERE appointment_id = $2 AND patient_id = $1 
       RETURNING appointment_id`,
      [req.user.user_id, id]
    );
    if (result.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found' });
    }
    await pool.query(
      `UPDATE appointment_tests SET status = 'cancelled' WHERE appointment_id = $1`,
      [id]
    );
    await pool.query('COMMIT');
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch {}
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

// Reschedule an existing booking (update date/time)
export const rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, reason } = req.body || {};

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'appointment_date and appointment_time are required' });
    }

    // Prevent rescheduling to the past
    const targetDateTime = new Date(`${appointment_date}T${String(appointment_time).slice(0,8)}`);
    if (isNaN(targetDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid date/time' });
    }
    const now = new Date();
    if (targetDateTime.getTime() < now.getTime()) {
      return res.status(400).json({ message: 'Cannot reschedule to a past time' });
    }

    // Ensure booking belongs to user and is not cancelled
    const existing = await pool.query(
      `SELECT appointment_id, status FROM appointments WHERE appointment_id = $1 AND patient_id = $2`,
      [id, req.user.user_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (existing.rows[0].status === 'cancelled') {
      return res.status(409).json({ message: 'Cancelled bookings cannot be rescheduled' });
    }

    // Update appointment
    const updateRes = await pool.query(
      `UPDATE appointments
         SET appointment_date = $1,
             appointment_time = $2,
             rescheduled_reason = COALESCE($3, rescheduled_reason),
             updated_at = NOW()
       WHERE appointment_id = $4 AND patient_id = $5
       RETURNING *`,
      [appointment_date, appointment_time, reason || null, id, req.user.user_id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json({ message: 'Appointment rescheduled', appointment: updateRes.rows[0] });
  } catch (err) {
    next(err);
  }
};
