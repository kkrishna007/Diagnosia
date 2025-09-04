
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, date_of_birth, gender } = req.body;
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, email, first_name, last_name, phone, date_of_birth, gender, is_active, created_at` ,
      [email, password_hash, first_name, last_name, phone, date_of_birth, gender]
    );
    const user = newUser.rows[0];
    // Assign 'patient' role to the new user
    await pool.query(
      `INSERT INTO user_role_assignments (user_id, role_id)
       SELECT $1, role_id FROM user_roles WHERE role_name = 'patient'`,
      [user.user_id]
    );
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        is_active: user.is_active,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

// Get current user profile
export const getMe = async (req, res, next) => {
  try {
    const userRes = await pool.query(
      'SELECT user_id, email, first_name, last_name, phone, date_of_birth, gender, is_active, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(userRes.rows[0]);
  } catch (err) {
    next(err);
  }
};
