import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../config/db.js';
import { authEmployee, requireRoles } from '../middleware/employeeAuth.js';

const router = express.Router();

// Sample Collector tasks
// List tasks visible to the authenticated collector. Admins see all.
router.get('/collector/tasks', authEmployee, requireRoles('sample_collector', 'admin'), async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const isAdmin = (req.user.roles || []).includes('admin');

    // If requester is admin, return all tasks. Otherwise scope by user's collector_type and appointment_type
    if (isAdmin) {
      const q = `
        SELECT ct.*, at.test_code, at.patient_name, at.patient_age, at.patient_gender, a.appointment_date, a.appointment_time, a.appointment_type
        FROM collection_tasks ct
        JOIN appointment_tests at ON ct.appointment_test_id = at.appointment_test_id
        JOIN appointments a ON ct.appointment_id = a.appointment_id
        ORDER BY ct.scheduled_at NULLS LAST, ct.created_at DESC
      `;
      const r = await pool.query(q);
      return res.json(r.rows);
    }

    // Get collector_type of requesting user from collectors table if it exists (some migrations optional)
    let collectorType = 'both';
    const collTblCheck = await pool.query("SELECT to_regclass('public.collectors') AS reg");
    if (collTblCheck.rows[0] && collTblCheck.rows[0].reg) {
      const ures = await pool.query('SELECT collector_type FROM collectors WHERE user_id = $1', [userId]);
      collectorType = ures.rows[0]?.collector_type || 'both';
    }

    // Map collector_type to appointment_type filter
    let appointmentTypeFilter = '';
    if (collectorType === 'home_collection') appointmentTypeFilter = "WHERE a.appointment_type = 'home_collection'";
    else if (collectorType === 'lab_visit') appointmentTypeFilter = "WHERE a.appointment_type = 'lab_visit'";

    const q2 = `
      SELECT ct.*, at.test_code, at.patient_name, at.patient_age, at.patient_gender, a.appointment_date, a.appointment_time, a.appointment_type
      FROM collection_tasks ct
      JOIN appointment_tests at ON ct.appointment_test_id = at.appointment_test_id
      JOIN appointments a ON ct.appointment_id = a.appointment_id
      ${appointmentTypeFilter}
      ORDER BY ct.scheduled_at NULLS LAST, ct.created_at DESC
    `;
    const r2 = await pool.query(q2);
    return res.json(r2.rows);
  } catch (err) {
    next(err);
  }
});

// Assign a task to the requesting collector (self-assign)
router.post('/collector/tasks/:taskId/assign', authEmployee, requireRoles('sample_collector', 'admin'), async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const userId = req.user.user_id;

    const taskRes = await pool.query('SELECT * FROM collection_tasks WHERE task_id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const task = taskRes.rows[0];

    // Update assignment
    await pool.query('UPDATE collection_tasks SET collector_id = $1, status = $2, assigned_at = NOW() WHERE task_id = $3', [userId, 'assigned', taskId]);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Mark a task as collected: create sample record and update statuses
router.post('/collector/tasks/:taskId/collect', authEmployee, requireRoles('sample_collector', 'admin'), async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const userId = req.user.user_id;

    // Fetch task
    const taskRes = await pool.query('SELECT * FROM collection_tasks WHERE task_id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const task = taskRes.rows[0];

    // Simple permission: allow only assigned collector or admin to mark collected
    const isAdmin = (req.user.roles || []).includes('admin');
    if (!isAdmin && task.collector_id && task.collector_id !== userId) {
      return res.status(403).json({ message: 'Task assigned to another collector' });
    }

    // Create sample row
    const sampleCode = `SMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const insertSample = await pool.query(
      `INSERT INTO samples (sample_code, appointment_test_id, collected_by, collected_at, collection_method, status, created_at)
       VALUES ($1, $2, $3, NOW(), $4, $5, NOW()) RETURNING sample_id, sample_code, collected_at`,
      [sampleCode, task.appointment_test_id, userId, task.collection_method || null, 'collected']
    );

    // Update appointment_test status
    await pool.query('UPDATE appointment_tests SET status = $1 WHERE appointment_test_id = $2', ['collected', task.appointment_test_id]);

    // Update task
    await pool.query('UPDATE collection_tasks SET status = $1, collected_at = NOW(), collector_id = COALESCE(collector_id, $2) WHERE task_id = $3', ['collected', userId, taskId]);

    return res.json({ ok: true, sample: insertSample.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Lab Technician worklist
router.get('/lab/worklist', authEmployee, requireRoles('lab_technician', 'lab_manager', 'admin'), async (req, res) => {
  res.json([]);
});

// Admin overview
router.get('/admin/overview', authEmployee, requireRoles('admin'), async (req, res) => {
  res.json({ ok: true });
});

// Admin: list employees with their roles
router.get('/admin/users', authEmployee, requireRoles('admin'), async (req, res, next) => {
  try {
    const q = `
      SELECT u.user_id, u.email, u.phone, u.first_name, u.last_name, u.date_of_birth, u.gender, c.collector_type, u.is_active, u.created_at,
             -- aggregate roles excluding the 'patient' role
             array_remove(array_agg(CASE WHEN r.role_name <> 'patient' THEN r.role_name END), NULL) AS roles,
             bool_or(r.role_name = 'patient') AS is_patient
      FROM users u
      LEFT JOIN collectors c ON c.user_id = u.user_id
      LEFT JOIN user_role_assignments ura ON ura.user_id = u.user_id
      LEFT JOIN user_roles r ON r.role_id = ura.role_id
      GROUP BY u.user_id, c.collector_type
      ORDER BY u.created_at DESC
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// Admin: update an employee user (basic fields and role)
router.put('/admin/users/:id', authEmployee, requireRoles('admin'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
  const { email, phone, first_name, last_name, date_of_birth, gender, role, collector_type, is_active } = req.body;
    // Validate role if provided
    let roleId = null;
    if (role) {
      const roleRes = await pool.query('SELECT role_id FROM user_roles WHERE role_name = $1', [role]);
      if (roleRes.rows.length === 0) return res.status(400).json({ message: 'Invalid role' });
      roleId = roleRes.rows[0].role_id;
    }

    // Validate collector_type
    const allowedCollectorTypes = ['home_collection', 'lab_visit', 'both'];
  if (collector_type && !allowedCollectorTypes.includes(collector_type)) return res.status(400).json({ message: 'Invalid collector_type' });

    // Update users table
    const updateFields = [];
    const values = [];
    let idx = 1;
    if (email !== undefined) { updateFields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { updateFields.push(`phone = $${idx++}`); values.push(phone); }
    if (first_name !== undefined) { updateFields.push(`first_name = $${idx++}`); values.push(first_name); }
    if (last_name !== undefined) { updateFields.push(`last_name = $${idx++}`); values.push(last_name); }
    if (date_of_birth !== undefined) { updateFields.push(`date_of_birth = $${idx++}`); values.push(date_of_birth); }
    if (gender !== undefined) { updateFields.push(`gender = $${idx++}`); values.push(gender); }
  // collector_type is stored in collectors table
  if (collector_type !== undefined) { updateFields.push(``); /* handled separately below */ }
    if (is_active !== undefined) { updateFields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (updateFields.length > 0) {
      const q = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${idx} RETURNING user_id, email, phone, first_name, last_name, date_of_birth, gender, is_active, created_at`;
      values.push(userId);
      const r = await pool.query(q, values);
      if (r.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    }

    // Handle collectors table update/insert for collector_type
    if (collector_type !== undefined) {
      // upsert into collectors
      await pool.query(`INSERT INTO collectors (user_id, collector_type, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET collector_type = EXCLUDED.collector_type`, [userId, collector_type]);
    }

    // Update role assignment (replace existing assignments with provided single role)
    if (roleId) {
      await pool.query('DELETE FROM user_role_assignments WHERE user_id = $1', [userId]);
      await pool.query('INSERT INTO user_role_assignments (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, roleId]);

      // If role is sample_collector and collector_type provided, upsert into collectors.
      if (role === 'sample_collector' && collector_type !== undefined) {
        await pool.query('INSERT INTO collectors (user_id, collector_type, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET collector_type = EXCLUDED.collector_type', [userId, collector_type]);
      }

      // If role changed away from sample_collector, remove collectors entry
      if (role !== 'sample_collector') {
        await pool.query('DELETE FROM collectors WHERE user_id = $1', [userId]);
      }
    }

    // Return updated user
    const out = await pool.query(`
      SELECT u.user_id, u.email, u.phone, u.first_name, u.last_name, u.date_of_birth, u.gender, c.collector_type, u.is_active, u.created_at,
             array_remove(array_agg(r.role_name), NULL) AS roles
      FROM users u
      LEFT JOIN collectors c ON c.user_id = u.user_id
      LEFT JOIN user_role_assignments ura ON ura.user_id = u.user_id
      LEFT JOIN user_roles r ON r.role_id = ura.role_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, c.collector_type
    `, [userId]);
    res.json(out.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Admin: delete (hard) an employee user
router.delete('/admin/users/:id', authEmployee, requireRoles('admin'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    await client.query('BEGIN');

    // Remove role assignments
    await client.query('DELETE FROM user_role_assignments WHERE user_id = $1', [userId]);
    // Remove addresses
    await client.query('DELETE FROM user_addresses WHERE user_id = $1', [userId]);

    // Attempt to delete the user
    const r = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
    if (r.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    // Likely foreign key constraint preventing delete; return helpful message
    if (err && err.code === '23503') {
      // On FK violation, gather dependent counts to return to client
      try {
        const userId = parseInt(req.params.id, 10);
        const baseQ = `
          SELECT
            (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) AS appointments,
            (SELECT COUNT(*) FROM appointment_tests WHERE appointment_id IN (SELECT appointment_id FROM appointments WHERE patient_id = $1)) AS appointment_tests,
            (SELECT COUNT(*) FROM payments WHERE user_id = $1) AS payments,
            (SELECT COUNT(*) FROM samples WHERE collected_by = $1 OR received_by_lab = $1) AS samples,
            (SELECT COUNT(*) FROM test_results WHERE processed_by = $1 OR verified_by = $1) AS test_results,
            (SELECT COUNT(*) FROM test_reports WHERE generated_by = $1 OR approved_by = $1) AS test_reports,
            (SELECT COUNT(*) FROM notifications WHERE user_id = $1) AS notifications,
            (SELECT COUNT(*) FROM user_addresses WHERE user_id = $1) AS addresses
        `;
        const dr = await pool.query(baseQ, [userId]);
        const dependents = dr.rows[0] || {};

        // Collect optional counts only if those tables exist (some migrations may not have been applied)
        const collTbl = await pool.query("SELECT to_regclass('public.collectors') AS reg");
        if (collTbl.rows[0] && collTbl.rows[0].reg) {
          const c = await pool.query('SELECT COUNT(*) AS cnt FROM collectors WHERE user_id = $1', [userId]);
          dependents.collectors = Number(c.rows[0].cnt);
        } else {
          dependents.collectors = 0;
        }

        const tasksTbl = await pool.query("SELECT to_regclass('public.collection_tasks') AS reg");
        if (tasksTbl.rows[0] && tasksTbl.rows[0].reg) {
          const ct = await pool.query('SELECT COUNT(*) AS cnt FROM collection_tasks WHERE collector_id = $1', [userId]);
          dependents.collection_tasks = Number(ct.rows[0].cnt);
        } else {
          dependents.collection_tasks = 0;
        }

        return res.status(400).json({ message: 'Cannot delete user: dependent records exist', dependents });
      } catch (e) {
        return res.status(400).json({ message: 'Cannot delete user: dependent records exist' });
      }
    }
    next(err);
  } finally {
    client.release();
  }
});

// Admin: get dependent counts for a user
router.get('/admin/users/:id/dependents', authEmployee, requireRoles('admin'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const baseQ = `
      SELECT
        (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) AS appointments,
        (SELECT COUNT(*) FROM appointment_tests WHERE appointment_id IN (SELECT appointment_id FROM appointments WHERE patient_id = $1)) AS appointment_tests,
        (SELECT COUNT(*) FROM payments WHERE user_id = $1) AS payments,
        (SELECT COUNT(*) FROM samples WHERE collected_by = $1 OR received_by_lab = $1) AS samples,
        (SELECT COUNT(*) FROM test_results WHERE processed_by = $1 OR verified_by = $1) AS test_results,
        (SELECT COUNT(*) FROM test_reports WHERE generated_by = $1 OR approved_by = $1) AS test_reports,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1) AS notifications,
        (SELECT COUNT(*) FROM user_addresses WHERE user_id = $1) AS addresses
    `;
    const dr = await pool.query(baseQ, [userId]);
    const dependents = dr.rows[0] || {};

    // Add optional counts only if those tables exist
    const collTbl = await pool.query("SELECT to_regclass('public.collectors') AS reg");
    if (collTbl.rows[0] && collTbl.rows[0].reg) {
      const c = await pool.query('SELECT COUNT(*) AS cnt FROM collectors WHERE user_id = $1', [userId]);
      dependents.collectors = Number(c.rows[0].cnt);
    } else {
      dependents.collectors = 0;
    }

    const tasksTbl = await pool.query("SELECT to_regclass('public.collection_tasks') AS reg");
    if (tasksTbl.rows[0] && tasksTbl.rows[0].reg) {
      const ct = await pool.query('SELECT COUNT(*) AS cnt FROM collection_tasks WHERE collector_id = $1', [userId]);
      dependents.collection_tasks = Number(ct.rows[0].cnt);
    } else {
      dependents.collection_tasks = 0;
    }

    res.json(dependents);
  } catch (err) {
    next(err);
  }
});

// Admin: force-delete a user and related dependent rows in a controlled order
router.post('/admin/users/:id/force-delete', authEmployee, requireRoles('admin'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    await client.query('BEGIN');

  // Delete dependent rows in safe order
  // Remove test results and reports where the user acted on them
  await client.query('DELETE FROM test_results WHERE processed_by = $1 OR verified_by = $1', [userId]);
  await client.query('DELETE FROM test_reports WHERE generated_by = $1 OR approved_by = $1', [userId]);

  // Samples and collection-related data
  // Samples (table exists in schema)
  await client.query('DELETE FROM samples WHERE collected_by = $1 OR received_by_lab = $1', [userId]);
  // collection_tasks and collectors may be part of optional migrations — check before deleting
  const tasksTbl = await client.query("SELECT to_regclass('public.collection_tasks') AS reg");
  if (tasksTbl.rows[0] && tasksTbl.rows[0].reg) {
    await client.query('DELETE FROM collection_tasks WHERE collector_id = $1', [userId]);
  }
  const collTbl = await client.query("SELECT to_regclass('public.collectors') AS reg");
  if (collTbl.rows[0] && collTbl.rows[0].reg) {
    await client.query('DELETE FROM collectors WHERE user_id = $1', [userId]);
  }

  // Appointments and appointment_tests (patient-side)
  await client.query('DELETE FROM appointment_tests WHERE appointment_id IN (SELECT appointment_id FROM appointments WHERE patient_id = $1)', [userId]);
  // Also remove appointments where user was patient or cancelled_by or rescheduled_from references may exist
  await client.query('DELETE FROM appointments WHERE patient_id = $1 OR cancelled_by = $1', [userId]);

  // Payments, notifications and addresses
  await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM user_addresses WHERE user_id = $1', [userId]);

  // Chatbot conversations and their messages where this user was participant or escalated_to
  await client.query('DELETE FROM chatbot_messages WHERE conversation_id IN (SELECT conversation_id FROM chatbot_conversations WHERE user_id = $1 OR escalated_to = $1)', [userId]);
  await client.query('DELETE FROM chatbot_conversations WHERE user_id = $1 OR escalated_to = $1', [userId]);

  // Audit logs and system settings referencing this user - guard by table/column existence
  const auditTbl = await client.query("SELECT to_regclass('public.audit_logs') AS reg");
  if (auditTbl.rows[0] && auditTbl.rows[0].reg) {
    const auditCol = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='updated_by') AS has_col");
    const hasAuditUpdatedBy = auditCol.rows[0] && auditCol.rows[0].has_col;
    if (hasAuditUpdatedBy) {
      await client.query('DELETE FROM audit_logs WHERE user_id = $1 OR updated_by = $1', [userId]);
    } else {
      await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    }
  }

  const sysTbl = await client.query("SELECT to_regclass('public.system_settings') AS reg");
  if (sysTbl.rows[0] && sysTbl.rows[0].reg) {
    const sysCol = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='system_settings' AND column_name='updated_by') AS has_col");
    const hasSysUpdatedBy = sysCol.rows[0] && sysCol.rows[0].has_col;
    if (hasSysUpdatedBy) {
      await client.query('DELETE FROM system_settings WHERE updated_by = $1', [userId]);
    }
  }

  // Finally remove role assignments
  await client.query('DELETE FROM user_role_assignments WHERE user_id = $1', [userId]);

    const r = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
    if (r.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    if (err && err.code === '23503') {
      return res.status(400).json({ message: 'Force delete failed due to dependent constraints' });
    }
    next(err);
  } finally {
    client.release();
  }
});

// Admin: create an employee user and assign role
router.post('/admin/users', authEmployee, requireRoles('admin'), async (req, res, next) => {
  try {
    const { email, phone, password, first_name, last_name, date_of_birth, gender, role, collector_type } = req.body;
    if (!email || !password || !role || !date_of_birth || !gender) return res.status(400).json({ message: 'email, password, role, date_of_birth and gender are required' });

    // Disallow creating admin accounts through this endpoint to avoid privilege escalation from the UI
    if (role === 'admin') return res.status(403).json({ message: 'Creating admin accounts is not allowed via this endpoint' });

    // Validate collector_type if provided
    const allowedCollectorTypes = ['home_collection', 'lab_visit', 'both'];
    if (collector_type && !allowedCollectorTypes.includes(collector_type)) {
      return res.status(400).json({ message: `Invalid collector_type. Allowed: ${allowedCollectorTypes.join(', ')}` });
    }

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

    // Persist collector_type into collectors table only for sample collectors
    if (collector_type && role === 'sample_collector') {
      await pool.query('INSERT INTO collectors (user_id, collector_type, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET collector_type = EXCLUDED.collector_type', [newUser.user_id, collector_type]);
    }

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
