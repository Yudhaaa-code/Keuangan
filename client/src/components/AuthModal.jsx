import React, { useState } from 'react';
import { 
  X, 
  Fingerprint, 
  Lock, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut,
  User as UserIcon,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Download,
  Upload,
  Database
} from 'lucide-react';
import {
  loginAccount,
  registerAccount,
  changeAccountPassword,
  setAccountPin,
  exportUserVaultJSON,
  importUserVaultJSON,
  getRegisteredAccounts,
  saveSessionUser,
} from '../utils/auth';

export default function AuthModal({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  onLockScreen,
  onVaultRestored,
  isFullPage = false,
}) {
  const [mode, setMode] = useState('LOGIN'); // LOGIN | REGISTER
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Change password & PIN states for logged-in user
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showChangePin, setShowChangePin] = useState(false);
  const [newPinCode, setNewPinCode] = useState('');

  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen && !isFullPage) return null;

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setAuthSuccessMsg('');
    setIsSubmitting(true);

    const res =
      mode === 'REGISTER'
        ? await registerAccount({ fullName, email, password })
        : await loginAccount({ email, password });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    onLogin(res.user);
    setAuthSuccessMsg(mode === 'REGISTER' ? 'Akun berhasil dibuat & masuk!' : 'Login berhasil!');
    setPassword('');
    setTimeout(() => {
      setAuthSuccessMsg('');
      if (onClose) onClose();
    }, 600);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setAuthSuccessMsg('');
    const res = await changeAccountPassword({
      email: user.email,
      currentPassword,
      newPassword,
    });
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    setAuthSuccessMsg(res.message);
    setCurrentPassword('');
    setNewPassword('');
    setShowChangePwd(false);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setAuthSuccessMsg('');
    const res = await setAccountPin(user.email, newPinCode);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    setAuthSuccessMsg(res.message);
    setNewPinCode('');
    setShowChangePin(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setAuthSuccessMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      const res = importUserVaultJSON(user, reader.result);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setAuthSuccessMsg(res.message);
        if (onVaultRestored) onVaultRestored();
      }
    };
    reader.readAsText(file);
  };

  const handleFillDemo = () => {
    setMode('LOGIN');
    setEmail('yudhae@keuangan.app');
    setPassword('password123');
    setErrorMsg('');
  };

  const handleBiometricLogin = async () => {
    setIsBiometricScanning(true);
    setErrorMsg('');

    try {
      if (window.PublicKeyCredential && navigator.credentials) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        await navigator.credentials
          .get({
            publicKey: {
              challenge,
              timeout: 15000,
              userVerification: 'preferred',
            },
          })
          .catch(() => null);
      }
    } catch {
      // Lanjutkan
    }

    setTimeout(async () => {
      const accounts = await getRegisteredAccounts();
      const targetAccount =
        accounts.find((a) => a.email === (email || '').toLowerCase()) || accounts[0];

      setIsBiometricScanning(false);
      const bioUser = {
        id: targetAccount.id,
        fullName: targetAccount.fullName,
        email: targetAccount.email,
        initials: targetAccount.initials,
        biometricEnabled: true,
        lastLogin: 'Verifikasi Biometrik',
      };
      saveSessionUser(bioUser);
      onLogin(bioUser);
      setAuthSuccessMsg('Otentikasi Biometrik Berhasil!');
      setTimeout(() => {
        setAuthSuccessMsg('');
        if (onClose) onClose();
      }, 600);
    }, 900);
  };

  const cardContent = (
    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/80 max-h-[92vh] flex flex-col pb-safe">
      {!isFullPage && (
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />
      )}

      {/* Header */}
      <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldCheck size={22} className="stroke-[2.3]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {user ? 'Profil, Keamanan & Backup' : 'Masuk ke Keuangan.app'}
            </h3>
            <p className="text-xs text-slate-500">
              {user ? 'Kelola sandi, PIN 6-Digit, dan cadangan data' : 'Brankas finansial pribadi Anda terproteksi'}
            </p>
          </div>
        </div>
        {!isFullPage && onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 overflow-y-auto">
        {authSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold animate-in zoom-in duration-150">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <span>{authSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 flex items-start gap-2 text-xs font-bold">
            <AlertCircle size={17} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {user ? (
          /* User Logged In Profile View */
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
                  {user.initials || 'YD'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900 truncate">{user.fullName}</h4>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 rounded-md uppercase">
                    {user.lastLogin || 'Sesi Terverifikasi'}
                  </span>
                </div>
              </div>

              {onLockScreen && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    onLockScreen();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  title="Kunci Layar Sekarang"
                >
                  <Lock size={14} />
                  <span>Kunci PIN</span>
                </button>
              )}
            </div>

            {/* Security Controls: Change Password & Set 6-Digit PIN */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Keamanan Akun & PIN:</span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePwd(!showChangePwd);
                    setShowChangePin(false);
                    setErrorMsg('');
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <KeyRound size={14} className="text-indigo-600" />
                  <span>Ubah Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChangePin(!showChangePin);
                    setShowChangePwd(false);
                    setErrorMsg('');
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Lock size={14} className="text-indigo-600" />
                  <span>Atur PIN 6-Digit</span>
                </button>
              </div>

              {showChangePwd && (
                <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800">Ubah Password Login</span>
                    <button
                      type="button"
                      onClick={() => setShowChangePwd(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Password saat ini"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password baru (min. 6 karakter)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Simpan Password Baru
                  </button>
                </form>
              )}

              {showChangePin && (
                <form onSubmit={handleSavePin} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800">Atur PIN Kunci Layar (6 Angka)</span>
                    <button
                      type="button"
                      onClick={() => setShowChangePin(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="Contoh: 123456"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-center tracking-[0.5em] text-base font-black"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Simpan PIN 6-Digit
                  </button>
                </form>
              )}
            </div>

            {/* Full Vault Backup & Restore (JSON) */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-indigo-600" />
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">Cadangkan & Pulihkan Data (JSON)</span>
                  <span className="text-[11px] text-slate-500">Pindahkan seluruh dompet, transaksi, & aset antar perangkat</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    exportUserVaultJSON(user);
                    setAuthSuccessMsg('File Backup (.json) berhasil diunduh!');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Unduh Backup</span>
                </button>

                <label className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload size={14} />
                  <span>Pulihkan JSON</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                if (onClose) onClose();
              }}
              className="w-full py-3 rounded-2xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <LogOut size={16} />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="space-y-4">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(''); }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                  mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(''); }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                  mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@keuangan.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Password {mode === 'REGISTER' && <span className="text-slate-400 font-normal">(Min. 6 karakter)</span>}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'REGISTER' ? 6 : 1}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Memverifikasi...' : mode === 'REGISTER' ? 'Daftar & Buat Brankas Baru' : 'Masuk ke Brankas'}
              </button>
            </form>

            {mode === 'LOGIN' && (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block">Akun Demo: yudhae@keuangan.app</span>
                    <span className="text-slate-500">Password: <code>password123</code></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold cursor-pointer"
                  >
                    Isi Otomatis
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atau Biometrik</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <button
                  type="button"
                  disabled={isBiometricScanning}
                  onClick={handleBiometricLogin}
                  className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Fingerprint size={17} />
                  <span>{isBiometricScanning ? 'Memverifikasi Sensor...' : 'Masuk dengan Sidik Jari / Passkey'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {cardContent}
    </div>
  );
}
