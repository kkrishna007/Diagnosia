import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../config/db.js';
import { authEmployee, requireRoles } from '../middleware/employeeAuth.js';

const router = express.Router();

// Sample Collector tasks
router.get('/collector/tasks', authEmployee, requireRoles('sample_collector', 'admin'), async (req, res) => {
  // TODO: replace with real data
  res.json([]);
});

// Lab Technician worklist
router.get('/lab/worklist', authEmployee, requireRoles('lab_technician', 'lab_manager', 'admin'), async (req, res) => {
  res.json([]);
});

// Admin overview
router.get('/admin/overview', authEmployee, requireRoles('admin'), async (req, res) => {
  res.json({ ok: true });
});

// Admin: create an employee user and assign role
router.post('/admin/users', authEmployee, requireRoles('admin'), async (req, res, next) => {
  try {
  const { email, phone, password, first_name, last_name, date_of_birth, gender, role } = req.body;
  if (!email || !password || !role || !date_of_birth || !gender) return res.status(400).json({ message: 'email, password, role, date_of_birth and gender are required' });

    // Check role exists
    const roleRes = await pool.query('SELECT role_id FROM user_roles WHERE role_name = $1', [role]);
    if (roleRes.rows.length === 0) return res.status(400).json({ message: 'Invalid role' });
    const roleId = roleRes.rows[0].role_id;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const insertRes = await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, date_of_birth, gender, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING user_id, email, phone, first_name, last_name, date_of_birth, gender, is_active, created_at`,
      [email, phone || null, password_hash, first_name || null, last_name || null, date_of_birth, gender]
    );
    const newUser = insertRes.rows[0];

    // Assign role
    await pool.query(
      `INSERT INTO user_role_assignments (user_id, role_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [newUser.user_id, roleId]
    );

    // Return created user (without password)
    res.status(201).json({ user: newUser, role });
  } catch (err) {
    next(err);
  }
});

export default router;
