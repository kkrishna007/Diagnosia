import jwt from 'jsonwebtoken';

export function authEmployee(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { audience: 'diagnosia-employee' });
    if (payload.realm !== 'employee') return res.status(403).json({ message: 'Wrong realm' });
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRoles(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!allowed.some((r) => roles.includes(r))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
