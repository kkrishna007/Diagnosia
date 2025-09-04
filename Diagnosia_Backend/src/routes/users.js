import express from 'express';
import { getAppointments, getTestResults, getProfile, updateProfile } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/appointments', auth, getAppointments);
router.get('/test-results', auth, getTestResults);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
