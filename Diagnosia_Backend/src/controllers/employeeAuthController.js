import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';

const EMPLOYEE_USER_ROLES = ['sample_collector', 'lab_technician', 'lab_manager'];
const ADMIN_ROLE = 'admin';

export const loginEmployee = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ message: 'Email/Phone and password are required' });
    const result = await pool.query(
      `SELECT u.user_id, u.email, u.phone, u.password_hash,
              COALESCE(ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL), '{}') AS roles
         FROM users u
         LEFT JOIN user_role_assignments ura ON ura.user_id = u.user_id
         LEFT JOIN user_roles r ON r.role_id = ura.role_id
        WHERE u.email = $1 OR u.phone = $1
        GROUP BY u.user_id`,
      [emailOrPhone]
    );
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const roles = user.roles || [];
  const hasEmployeeRole = roles.some((r) => EMPLOYEE_USER_ROLES.includes(r));
  if (!hasEmployeeRole) return res.status(403).json({ message: 'Not authorized for employee portal' });

    const token = jwt.sign(
      { user_id: user.user_id, roles, realm: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '8h', audience: 'diagnosia-employee' }
    );

    res.json({
      token,
      user: { user_id: user.user_id, email: user.email, phone: user.phone, roles },
    });
  } catch (err) {
    next(err);
  }
};

  export const loginAdmin = async (req, res, next) => {
    try {
      const { emailOrPhone, password } = req.body;
      if (!emailOrPhone || !password) return res.status(400).json({ message: 'Email/Phone and password are required' });
      const result = await pool.query(
        `SELECT u.user_id, u.email, u.phone, u.password_hash,
                COALESCE(ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL), '{}') AS roles
           FROM users u
           LEFT JOIN user_role_assignments ura ON ura.user_id = u.user_id
           LEFT JOIN user_roles r ON r.role_id = ura.role_id
          WHERE u.email = $1 OR u.phone = $1
          GROUP BY u.user_id`,
        [emailOrPhone]
      );
      if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
      const user = result.rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const roles = user.roles || [];
      if (!roles.includes(ADMIN_ROLE)) return res.status(403).json({ message: 'Admin access required' });

      const token = jwt.sign(
        { user_id: user.user_id, roles, realm: 'employee' },
        process.env.JWT_SECRET,
        { expiresIn: '8h', audience: 'diagnosia-employee' }
      );

      res.json({
        token,
        user: { user_id: user.user_id, email: user.email, phone: user.phone, roles },
      });
    } catch (err) {
      next(err);
    }
  };
