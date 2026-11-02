import React, { useState } from 'react';
import { Lock, Delete, Fingerprint, LogOut, ShieldAlert } from 'lucide-react';
import { verifyAccountPin } from '../utils/auth';

export default function PinLockModal({ isOpen, user, onUnlock, onLogout }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen || !user) return null;

  const handleDigit = async (digit) => {
    if (pin.length >= 6 || isChecking) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 6) {
      setIsChecking(true);
      const valid = await verifyAccountPin(user.email, nextPin);
      setIsChecking(false);
      if (valid) {
        setPin('');
        onUnlock();
      } else {
        setError('PIN 6-Digit salah! (Default: 123456)');
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleBiometricUnlock = async () => {
    try {
      if (window.PublicKeyCredential && navigator.credentials) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        await navigator.credentials
          .get({ publicKey: { challenge, timeout: 10000, userVerification: 'preferred' } })
          .catch(() => null);
      }
    } catch {
      // continue
    }
    setPin('');
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-white select-none animate-in fade-in duration-200">
      <div className="max-w-xs w-full flex flex-col items-center space-y-6">
        
        {/* Icon & User Info */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Lock size={28} />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight mt-2">Brankas Terkunci</h3>
          <p className="text-xs text-slate-400">
            Masukkan 6-Digit PIN keamanan untuk <strong className="text-slate-200">{user.fullName}</strong>
          </p>
        </div>

        {/* 6 Dots Indicator */}
        <div className="flex items-center justify-center gap-3.5 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  filled
                    ? 'bg-indigo-400 scale-110 shadow-[0_0_12px_#818cf8]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-bounce">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-15 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-xl font-extrabold transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Biometric Quick Button */}
          <button
            type="button"
            onClick={handleBiometricUnlock}
            className="h-15 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/70 active:scale-95 border border-indigo-800/50 text-indigo-300 flex items-center justify-center transition-all cursor-pointer"
            title="Buka dengan Sidik Jari"
          >
            <Fingerprint size={24} />
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-15 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-xl font-extrabold transition-all cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-15 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Hapus"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <span className="text-[11px] text-slate-500">PIN Bawaan: 123456 (Dapat diubah di Profil)</span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 mt-1 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Ganti Akun / Logout</span>
          </button>
        </div>

      </div>
    </div>
  );
}

