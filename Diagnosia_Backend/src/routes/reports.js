import express from 'express';
import { getReports, getReportById } from '../controllers/reportController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all reports for logged-in user
router.get('/', auth, getReports);
// Get a specific report
router.get('/:report_id', auth, getReportById);

export default router;
