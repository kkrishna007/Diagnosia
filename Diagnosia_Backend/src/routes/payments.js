import express from 'express';
import { getPayments, createPayment, getPaymentByAppointment } from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all payments for logged-in user
router.get('/', auth, getPayments);
// Create a new payment
router.post('/', auth, createPayment);
// Get payment by appointment
router.get('/appointment/:appointment_id', auth, getPaymentByAppointment);

export default router;
