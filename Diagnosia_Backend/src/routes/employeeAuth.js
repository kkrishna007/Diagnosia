import express from 'express';
import { loginEmployee, loginAdmin } from '../controllers/employeeAuthController.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.post('/admin/login', loginAdmin);

export default router;
