import { Router } from 'express';
import prisma from '../config/db.js';
import { hashPassword, verifyPassword, signToken, authRateLimiter } from '../middlewares/auth.js';

const router = Router();

// Fallback in-memory user store when PostgreSQL is offline / unconfigured in local dev
const memoryUsers = new Map([
  [
    'yudhae@keuangan.app',
    {
      id: 'usr-yudhae-01',
      email: 'yudhae@keuangan.app',
      fullName: 'YuDhae',
      passwordHash: hashPassword('123456'),
    },
  ],
]);

async function findUserByEmail(normalizedEmail) {
  try {
    return await prisma.user.findUnique({ where: { email: normalizedEmail } });
  } catch {
    return memoryUsers.get(normalizedEmail) || null;
  }
}

async function createUserRecord({ email, fullName, passwordHash }) {
  try {
    return await prisma.user.create({
      data: { email, fullName, passwordHash },
    });
  } catch {
    const newUser = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      passwordHash,
    };
    memoryUsers.set(email, newUser);
    return newUser;
  }
}

router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk.' });
    }

    const user = await createUserRecord({
      email: normalizedEmail,
      fullName: String(fullName || normalizedEmail.split('@')[0]).trim(),
      passwordHash: hashPassword(password),
    });

    const token = signToken({ id: user.id, email: user.email, fullName: user.fullName });
    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        initials: user.fullName.slice(0, 2).toUpperCase(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akun belum terdaftar. Silakan Daftar Baru terlebih dahulu.',
      });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: 'Password yang Anda masukkan salah!',
      });
    }

    const token = signToken({ id: user.id, email: user.email, fullName: user.fullName });
    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        initials: user.fullName.slice(0, 2).toUpperCase(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
