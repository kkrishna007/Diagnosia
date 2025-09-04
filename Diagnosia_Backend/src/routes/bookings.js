import express from 'express';
import { createBooking, getBookings, getBookingById, deleteBooking, getAvailableSlots, rescheduleBooking } from '../controllers/bookingController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getBookings);
router.get('/slots', getAvailableSlots);
router.get('/:id', auth, getBookingById);
router.delete('/:id', auth, deleteBooking);
router.patch('/:id/reschedule', auth, rescheduleBooking);

export default router;
