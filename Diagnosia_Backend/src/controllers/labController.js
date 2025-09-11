import pool from '../../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeFlagsForPanel } from '../utils/computeFlags.js';
// AI generation
let genState = null;
async function getGenModel() {
  if (genState) return genState;
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const genAI = new GoogleGenerativeAI(key);
    const modelIds = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    genState = { genAI, modelIds };
    return genState;
  } catch (e) {
    return null;
  }
}

let panels = {};
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const p = path.join(__dirname, '..', 'data', 'test_panels.json');
  const raw = fs.readFileSync(p, 'utf8');
  panels = JSON.parse(raw || '{}');
} catch (e) {
  panels = {};
}

// GET /employee/lab/worklist
export async function getWorklist(req, res, next) {
  try {
    // Return appointment_tests that have sample_collected status
    // Include latest test_result (if any) using lateral join
    const q = `
  SELECT at.*, a.appointment_date, a.appointment_time, a.appointment_type,
             u.user_id AS patient_id, u.first_name, u.last_name, u.gender, u.date_of_birth, u.email, u.phone,
             tr.result_id, tr.result_values, tr.processed_at AS result_processed_at
      FROM appointment_tests at
      JOIN appointments a ON at.appointment_id = a.appointment_id
      JOIN users u ON a.patient_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT * FROM test_results tr WHERE tr.appointment_test_id = at.appointment_test_id
        ORDER BY tr.processed_at DESC NULLS LAST LIMIT 1
      ) tr ON true
      WHERE at.status IN ('sample_collected','reported')
         OR a.status IN ('sample_collected','completed')
      ORDER BY a.appointment_date DESC, at.appointment_test_id ASC
    `;
    const r = await pool.query(q);
    // Map to a compact structure
    const out = r.rows.map(row => ({
      appointment_test_id: row.appointment_test_id,
      appointment_id: row.appointment_id,
      test_code: row.test_code,
      test_name: row.test_name || row.test_code,
      patient_id: row.patient_id,
      patient_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      patient_gender: row.gender,
      patient_dob: row.date_of_birth,
      patient_email: row.email,
      patient_phone: row.phone,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      status: row.status || row.test_status,
      has_result: !!row.result_id,
      result_id: row.result_id || null,
      result_values: row.result_values || null,
      result_processed_at: row.result_processed_at || null
    }));
    res.json(out);
  } catch (err) {
    next(err);
  }
}

// GET single test result by appointment_test_id
export async function getResult(req, res, next) {
  try {
    const appointmentTestId = parseInt(req.params.appointment_test_id, 10);
    if (!appointmentTestId) return res.status(400).json({ message: 'Invalid appointment_test_id' });
    const r = await pool.query('SELECT * FROM test_results WHERE appointment_test_id = $1 ORDER BY processed_at DESC NULLS LAST LIMIT 1', [appointmentTestId]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Result not found' });
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /employee/lab/panels/:test_code
export async function getPanel(req, res, next) {
  try {
    const code = (req.params.test_code || '').toLowerCase();
    const panel = panels[code];
    if (!panel) return res.status(404).json({ message: 'Panel not found' });
    res.json(panel);
  } catch (err) {
    next(err);
  }
}

// POST /employee/lab/results
export async function saveResult(req, res, next) {
  try {
  const { appointment_test_id, result_values, comment, interpretation: interpIn, recommendation: recIn, recommendations: recPluralIn } = req.body;
    if (!appointment_test_id || !result_values || typeof result_values !== 'object') {
      return res.status(400).json({ message: 'appointment_test_id and result_values are required' });
    }

    // Fetch appointment_test and patient
    const atRes = await pool.query('SELECT * FROM appointment_tests WHERE appointment_test_id = $1', [appointment_test_id]);
    if (atRes.rows.length === 0) return res.status(404).json({ message: 'Appointment test not found' });
    const at = atRes.rows[0];

    // If a result already exists for this appointment_test, return it instead of inserting a duplicate
    const existing = await pool.query('SELECT * FROM test_results WHERE appointment_test_id = $1 ORDER BY processed_at DESC NULLS LAST LIMIT 1', [appointment_test_id]);
    if (existing.rows.length > 0) {
      // also mark parent appointment as completed so patient can view results
      try {
        await pool.query('UPDATE appointments SET status = $1 WHERE appointment_id = $2', ['completed', at.appointment_id]);
      } catch (e) { /* ignore */ }
      return res.status(200).json({ ok: true, message: 'result_exists', result: existing.rows[0] });
    }

    const apptRes = await pool.query('SELECT * FROM appointments WHERE appointment_id = $1', [at.appointment_id]);
    const appt = apptRes.rows[0];
    const patientRes = await pool.query('SELECT * FROM users WHERE user_id = $1', [appt.patient_id]);
    const patient = patientRes.rows[0] || {};

    const code = (at.test_code || '').toLowerCase();
    const panel = panels[code] || null;

    let abnormal_flags = {};
    if (panel) {
      abnormal_flags = computeFlagsForPanel(panel.parameters || [], result_values, patient);
    }

    // insert into test_results -- set sample_id if a sample exists
    let sampleId = null;
    const sres = await pool.query('SELECT sample_id FROM samples WHERE appointment_test_id = $1 ORDER BY collected_at DESC LIMIT 1', [appointment_test_id]);
    if (sres.rows.length) sampleId = sres.rows[0].sample_id;

    const insertQ = `
      INSERT INTO test_results (
        appointment_test_id, sample_id, test_code,
        processed_by, verified_by,
        result_values, reference_ranges, abnormal_flags,
        interpretation, recommendations,
        result_status, processed_at, verified_at
      )
      VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,'final',NOW(),NOW())
      RETURNING *
    `;
    const processedBy = req.user?.user_id || null;
    const referenceRanges = panel ? { parameters: panel.parameters } : null;
    const interp = (interpIn ?? comment) || null;
    const rec = (recIn ?? recPluralIn) || null;
  const ir = await pool.query(insertQ, [appointment_test_id, sampleId, at.test_code, processedBy, result_values, referenceRanges, abnormal_flags, interp, rec]);

    // update appointment_test status to 'reported' or similar
    await pool.query('UPDATE appointment_tests SET status = $1 WHERE appointment_test_id = $2', ['reported', appointment_test_id]);

    // mark parent appointment complete so patient sees results
    try {
      await pool.query('UPDATE appointments SET status = $1 WHERE appointment_id = $2', ['completed', at.appointment_id]);
    } catch (e) { /* ignore */ }

  res.status(201).json(ir.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /employee/lab/generate-interpretation
export async function generateInterpretation(req, res, next) {
  try {
    const model = await getGenModel();
    if (!model) return res.status(500).json({ message: 'AI model not configured. Set GEMINI_API_KEY.' });

    const { patient, test, results } = req.body || {};
    if (!results) return res.status(400).json({ message: 'results are required' });

    const prompt = [
      'You are a certified Pathologist for a clinical laboratory. Based on the provided patient profile, test details, and measured parameters, provide:',
      '1) Interpretation: concise clinical interpretation highlighting abnormal/borderline values, potential differentials, and clinical correlation.',
      '2) Recommendation: clear, actionable next steps, follow-up tests, critical thresholds for escalation, and monitoring guidance.',
      '',
      'Constraints:',
      '- Be specific to the values and reference ranges provided. Do not restate all raw values.',
      '- Avoid generic disclaimers and avoid revealing internal reasoning. Do not include markdown or extra commentary.',
      '- Keep each field under 250 words.',
      '',
      'Return a strict JSON object with exactly these keys: "interpretation" and "recommendation".',
      '',
      'Patient:', JSON.stringify(patient || {}),
      'Test:', JSON.stringify(test || {}),
      'PanelParameters:', JSON.stringify(results?.panel || []),
      'MeasuredValues:', JSON.stringify(results?.values || results),
    ].join('\n');

    const { genAI, modelIds } = model;
    let lastErr = null;
    for (const id of modelIds) {
      try {
        const m = genAI.getGenerativeModel({ model: id });
        const ai = await m.generateContent([{ text: prompt }]);
        const text = (ai?.response?.text?.() || '').trim();
        const cleaned = text.replace(/^```json|^```|```$/g, '').trim();
        let parsed;
        try { parsed = JSON.parse(cleaned); } catch (e) {
          const mm = cleaned.match(/\{[\s\S]*\}/);
          if (mm) parsed = JSON.parse(mm[0]);
        }
        if (parsed && parsed.interpretation && parsed.recommendation) {
          return res.json({ interpretation: parsed.interpretation, recommendation: parsed.recommendation });
        }
        lastErr = new Error('AI response incomplete');
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    return res.status(400).json({ message: lastErr?.message || 'Failed to generate interpretation' });
  } catch (err) {
    return next(err);
  }
}

export default { getWorklist, getPanel, saveResult, generateInterpretation };
