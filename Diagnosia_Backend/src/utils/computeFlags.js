import logger from './logger.js';

// Helper: numeric compare, returns -1,0,1 or null for non-numeric
function _compareNumeric(val) {
  const n = Number(val);
  if (Number.isFinite(n)) return n;
  return null;
}

// Evaluate a single parameter against its range definition and patient context
export function evaluateParam(paramDef = {}, valueRaw, patient = {}) {
  const key = paramDef.key;
  const result = { key, value: valueRaw, flag: 'normal', reason: null };
  if (valueRaw === undefined || valueRaw === null || valueRaw === '') {
    result.flag = 'missing';
    result.reason = 'No value provided';
    return result;
  }

  const v = _compareNumeric(valueRaw);
  // If parameter is non-numeric (urine color, notes), skip numeric flagging
  if (v === null) return result;

  const range = paramDef.range || {};

  // Resolve conditional ranges by sex first
  let low = range.low ?? null;
  let high = range.high ?? null;
  if (patient?.gender) {
    const g = (patient.gender || '').toLowerCase();
    if (range[g]) {
      low = range[g].low ?? low;
      high = range[g].high ?? high;
    }
  }

  try {
    if (low !== null && v < Number(low)) {
      result.flag = 'low';
      result.reason = `Below expected (${low})`;
    } else if (high !== null && v > Number(high)) {
      result.flag = 'high';
      result.reason = `Above expected (${high})`;
    }
  } catch (e) {
    logger && logger.error && logger.error('computeFlags evaluate error', e.message || e);
    result.flag = 'error';
    result.reason = 'Evaluation error';
  }

  return result;
}

// Evaluate a panel: paramDefs is array, values is object, patient context optional
export function computeFlagsForPanel(paramDefs = [], values = {}, patient = {}) {
  const flags = {};
  for (const p of paramDefs) {
    try {
      const r = evaluateParam(p, values[p.key], patient);
      flags[p.key] = r;
    } catch (e) {
      flags[p.key] = { key: p.key, value: values[p.key], flag: 'error', reason: e.message || 'evaluate error' };
    }
  }
  return flags;
}

export default computeFlagsForPanel;
