import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'keuangan-super-secret-key-2026';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function signToken(payload) {
  const tokenPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [data, sig] = (token || '').split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) {
      return null; // Token kedaluwarsa
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, originalHash] = (stored || '').split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

// Rate limiter anti brute-force untuk endpoint login/register
const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

export const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now - record.firstAttempt < WINDOW_MS) {
    if (record.count >= MAX_ATTEMPTS) {
      const waitMin = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000);
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${waitMin} menit.`,
      });
    }
    record.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }

  next();
};

// Middleware otentikasi: Wajib Bearer Token di production, mengizinkan fallback dev di development
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.slice(7));
    if (decoded && decoded.id) {
      req.user = decoded;
      return next();
    }
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        message: 'Sesi login telah berakhir atau token tidak valid. Silakan login kembali.',
      });
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi diperlukan.',
    });
  }

  // Fallback hanya untuk mode lokal / development
  const userId = req.headers['x-user-id'] || 'default-user-id';
  req.user = { id: userId, email: 'demo@keuangan.app' };
  next();
};
