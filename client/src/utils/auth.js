import { apiRequest } from './api';

const ACCOUNTS_KEY = 'keuangan_registered_accounts_v1';
const SESSION_KEY = 'keuangan_session_user_v1';

// Hash password/PIN menggunakan Web Crypto API (SHA-256)
export async function hashPasswordClient(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`keuangan_salt_2026:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Ambil daftar akun terdaftar (termasuk akun bawaan YuDhae dengan password: password123 & PIN: 123456)
export async function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }

  const defaultPasswordHash = await hashPasswordClient('password123');
  const defaultPinHash = await hashPasswordClient('123456');
  const defaultAccounts = [
    {
      id: 'default-user-id',
      fullName: 'YuDhae',
      email: 'yudhae@keuangan.app',
      initials: 'YD',
      passwordHash: defaultPasswordHash,
      pinHash: defaultPinHash,
      biometricEnabled: true,
    },
  ];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

export async function registerAccount({ fullName, email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (fullName || cleanEmail.split('@')[0]).trim();

  if (!cleanEmail || !password) {
    return { success: false, message: 'Email dan password wajib diisi.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password minimal harus 6 karakter.' };
  }

  const apiRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName: cleanName, email: cleanEmail, password }),
  });

  if (apiRes && !apiRes.offline && !apiRes.success) {
    return { success: false, message: apiRes.error || 'Gagal mendaftar.' };
  }

  const accounts = await getRegisteredAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'Email ini sudah terdaftar! Silakan gunakan menu Masuk Akun.' };
  }

  const passwordHash = await hashPasswordClient(password);
  const newAccount = {
    id: apiRes?.data?.id || `user-${Date.now()}`,
    fullName: cleanName,
    email: cleanEmail,
    initials: cleanName.slice(0, 2).toUpperCase(),
    passwordHash,
    pinHash: null,
    token: apiRes?.data?.token || null,
    biometricEnabled: true,
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

  const sessionUser = {
    id: newAccount.id,
    fullName: newAccount.fullName,
    email: newAccount.email,
    initials: newAccount.initials,
    token: newAccount.token,
    biometricEnabled: true,
    lastLogin: apiRes?.success ? 'Tersinkronisasi ke Server' : 'Terdaftar & Aktif',
  };

  saveSessionUser(sessionUser);
  return { success: true, user: sessionUser };
}

export async function loginAccount({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, message: 'Email dan password wajib diisi.' };
  }

  const apiRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: cleanEmail, password }),
  });

  if (apiRes && !apiRes.offline) {
    if (!apiRes.success) {
      return { success: false, message: apiRes.error || 'Email atau password salah!' };
    }
    const sessionUser = {
      ...apiRes.data,
      biometricEnabled: true,
      lastLogin: 'Tersinkronisasi ke Server',
    };
    saveSessionUser(sessionUser);
    return { success: true, user: sessionUser };
  }

  const accounts = await getRegisteredAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    return {
      success: false,
      message: 'Akun dengan email ini belum terdaftar. Silakan klik tab "Daftar Akun Baru" terlebih dahulu.',
    };
  }

  const inputHash = await hashPasswordClient(password);
  if (found.passwordHash !== inputHash) {
    return {
      success: false,
      message: 'Password yang Anda masukkan salah! Silakan periksa kembali.',
    };
  }

  const sessionUser = {
    id: found.id,
    fullName: found.fullName,
    email: found.email,
    initials: found.initials,
    biometricEnabled: true,
    lastLogin: 'Terverifikasi',
  };

  saveSessionUser(sessionUser);
  return { success: true, user: sessionUser };
}

export async function changeAccountPassword({ email, currentPassword, newPassword }) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Password baru minimal 6 karakter.' };
  }
  const accounts = await getRegisteredAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === (email || '').toLowerCase());
  if (idx === -1) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }

  const currentHash = await hashPasswordClient(currentPassword);
  if (accounts[idx].passwordHash !== currentHash) {
    return { success: false, message: 'Password lama tidak sesuai!' };
  }

  accounts[idx].passwordHash = await hashPasswordClient(newPassword);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { success: true, message: 'Password berhasil diperbarui!' };
}

// =======================================
// 6-DIGIT PIN LOCK MANAGEMENT
// =======================================
export async function setAccountPin(email, pinCode) {
  if (!/^\d{6}$/.test(pinCode)) {
    return { success: false, message: 'PIN harus berupa 6 digit angka.' };
  }
  const accounts = await getRegisteredAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === (email || '').toLowerCase());
  if (idx === -1) return { success: false, message: 'Akun tidak ditemukan.' };

  accounts[idx].pinHash = await hashPasswordClient(pinCode);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { success: true, message: 'PIN Keamanan 6-Digit berhasil disimpan!' };
}

export async function verifyAccountPin(email, pinCode) {
  const accounts = await getRegisteredAccounts();
  const acc = accounts.find((a) => a.email.toLowerCase() === (email || '').toLowerCase());
  const inputHash = await hashPasswordClient(pinCode);

  if (acc && acc.pinHash) {
    return acc.pinHash === inputHash;
  }
  // Fallback default PIN: 123456 jika user belum mengatur PIN khusus
  return pinCode === '123456';
}

// =======================================
// FULL VAULT BACKUP & RESTORE (JSON)
// =======================================
export function getStorageKeysForEmail(email) {
  const userScope = (email || 'yudhae@keuangan.app').toLowerCase();
  const isDefaultUser = userScope === 'yudhae@keuangan.app';
  return {
    wallets: isDefaultUser ? 'keuangan_wallets_v2' : `keuangan_wallets_${userScope}`,
    transactions: isDefaultUser ? 'keuangan_transactions_v2' : `keuangan_transactions_${userScope}`,
    budgets: isDefaultUser ? 'keuangan_budgets_v1' : `keuangan_budgets_${userScope}`,
    debts: isDefaultUser ? 'keuangan_debts_v1' : `keuangan_debts_${userScope}`,
    goals: isDefaultUser ? 'keuangan_goals_v1' : `keuangan_goals_${userScope}`,
    assets: isDefaultUser ? 'keuangan_assets_v1' : `keuangan_assets_${userScope}`,
    categories: isDefaultUser ? 'keuangan_custom_categories_v1' : `keuangan_categories_${userScope}`,
  };
}

export function exportUserVaultJSON(user) {
  const keys = getStorageKeysForEmail(user?.email);
  const safeParse = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const payload = {
    app: 'Keuangan.app',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    account: {
      email: user?.email,
      fullName: user?.fullName,
    },
    vault: {
      wallets: safeParse(keys.wallets, []),
      transactions: safeParse(keys.transactions, []),
      budgets: safeParse(keys.budgets, []),
      debts: safeParse(keys.debts, []),
      goals: safeParse(keys.goals, []),
      assets: safeParse(keys.assets, []),
      customCategories: safeParse(keys.categories, { EXPENSE: [], INCOME: [] }),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Backup_Keuangan_${(user?.fullName || 'User').replace(/\s+/g, '_')}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importUserVaultJSON(user, jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !parsed.vault || !Array.isArray(parsed.vault.wallets)) {
      return { success: false, message: 'Format file backup JSON tidak valid.' };
    }

    const keys = getStorageKeysForEmail(user?.email);
    const { wallets, transactions, budgets, debts, goals, assets, customCategories } = parsed.vault;

    if (wallets) localStorage.setItem(keys.wallets, JSON.stringify(wallets));
    if (transactions) localStorage.setItem(keys.transactions, JSON.stringify(transactions));
    if (budgets) localStorage.setItem(keys.budgets, JSON.stringify(budgets));
    if (debts) localStorage.setItem(keys.debts, JSON.stringify(debts));
    if (goals) localStorage.setItem(keys.goals, JSON.stringify(goals));
    if (assets) localStorage.setItem(keys.assets, JSON.stringify(assets));
    if (customCategories) localStorage.setItem(keys.categories, JSON.stringify(customCategories));

    return { success: true, message: 'Data brankas berhasil dipulihkan!' };
  } catch {
    return { success: false, message: 'Gagal membaca file JSON. Pastikan file tidak rusak.' };
  }
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSessionUser(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('keuangan_user', JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('keuangan_user');
  }
}
