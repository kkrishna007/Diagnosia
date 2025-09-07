#!/usr/bin/env node
/**
 * Seed an admin user and role into the database.
 * Idempotent: will not duplicate existing role or user.
 * Usage: node scripts/seedAdmin.js --email admin@diagnosia.com --password secret123 --first_name Admin --last_name User
 */
import pool from '../src/config/db.js';
import bcrypt from 'bcryptjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      out[k] = args[i+1];
      i++;
    }
  }
  return out;
}

async function run() {
  const opts = parseArgs();
  const email = opts.email || 'admin@diagnosia.com';
  const password = opts.password || 'Admin@1234';
  const first_name = opts.first_name || 'Admin';
  const last_name = opts.last_name || 'User';
  // Required by schema: provide safe defaults if not supplied
  const phone = opts.phone || '+910000000000';
  const date_of_birth = opts.date_of_birth || '1970-01-01';
  const gender = (opts.gender || 'other').toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure role exists
    const roleRes = await client.query(
      `INSERT INTO user_roles (role_name, role_description)
         VALUES ($1, $2)
       ON CONFLICT (role_name) DO UPDATE SET role_description = EXCLUDED.role_description
       RETURNING role_id`,
      ['admin', 'System administrator']
    );
    const roleId = roleRes.rows[0].role_id;

    // Check if user exists by email
    const userRes = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);
    let userId;
    if (userRes.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      const insertRes = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, gender, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING user_id`,
        [email, password_hash, first_name, last_name, phone, date_of_birth, gender]
      );
      userId = insertRes.rows[0].user_id;
      console.log('Created user id', userId);
    } else {
      userId = userRes.rows[0].user_id;
      console.log('User already exists id', userId);
    }

    // Assign role to user (idempotent)
    await client.query(
      `INSERT INTO user_role_assignments (user_id, role_id)
         VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    await client.query('COMMIT');
    console.log('Admin seeding complete.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
