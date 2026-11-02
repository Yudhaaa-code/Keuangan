import React, { useState, useEffect } from 'react';
import { X, Trash2, Wallet as WalletIcon } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

const WALLET_TYPES = [
  { value: 'BANK', label: 'Rekening Bank', badge: 'BANK' },
  { value: 'E_WALLET', label: 'E-Wallet (GoPay/OVO/Dana)', badge: 'E-WALLET' },
  { value: 'CASH', label: 'Dompet Tunai', badge: 'TUNAI' },
  { value: 'INVESTMENT', label: 'RDN / Investasi', badge: 'INVEST' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit / Paylater', badge: 'KREDIT' },
];

const COLOR_OPTIONS = [
  { value: 'bg-blue-600', label: 'Biru' },
  { value: 'bg-emerald-600', label: 'Hijau' },
  { value: 'bg-amber-600', label: 'Kuning / Amber' },
  { value: 'bg-indigo-600', label: 'Indigo' },
  { value: 'bg-rose-600', label: 'Merah / Rose' },
  { value: 'bg-violet-600', label: 'Ungu' },
  { value: 'bg-slate-800', label: 'Hitam / Slate' },
];

export default function WalletModal({ isOpen, onClose, initialData, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [colorHex, setColorHex] = useState('bg-blue-600');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'BANK');
      setBalance(String(initialData.balance ?? 0));
      setAccountNumber(initialData.accountNumber || '');
      setColorHex(initialData.colorHex || 'bg-blue-600');
    } else {
      setName('');
      setType('BANK');
      setBalance('');
      setAccountNumber('');
      setColorHex('bg-blue-600');
    }
    setConfirmDelete(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedType = WALLET_TYPES.find((t) => t.value === type);
    onSave({
      id: initialData?.id,
      name: name.trim(),
      type,
      textBadge: matchedType?.badge || type,
      balance: Number(balance) || 0,
      accountNumber: accountNumber.trim(),
      colorHex,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col pb-safe">
        
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 sm:p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <WalletIcon size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {initialData ? 'Edit Dompet & Saldo' : 'Tambah Dompet Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nama Dompet / Rekening</label>
            <input
              type="text"
              required
              placeholder="Contoh: BCA Tahapan, Mandiri, ShopeePay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Jenis Dompet</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {WALLET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">No. Rekening (Opsional)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              {initialData ? 'Saldo Saat Ini (IDR)' : 'Saldo Awal (IDR)'}
            </label>
            <CurrencyInput
              required
              placeholder="0"
              value={balance}
              onChange={setBalance}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Warna Kartu</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorHex(c.value)}
                  className={`w-9 h-9 rounded-xl ${c.value} transition-transform cursor-pointer ${
                    colorHex === c.value ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-75 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {confirmDelete && initialData ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
              <p className="text-xs font-bold text-rose-800">
                Yakin ingin menghapus dompet "{initialData.name}"?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialData.id);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus Dompet
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center gap-2.5">
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-3.5 rounded-2xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                >
                  <Trash2 size={16} />
                  <span>Hapus</span>
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer text-sm"
              >
                {initialData ? 'Simpan Perubahan' : 'Buat Dompet'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
