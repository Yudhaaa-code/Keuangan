import React, { useState } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function TransferModal({ isOpen, onClose, wallets, onTransfer }) {
  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id || '');
  const [targetWalletId, setTargetWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [adminFee, setAdminFee] = useState('0');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const sourceWallet = wallets.find((w) => w.id === sourceWalletId) || wallets[0];

  const totalDeduction = (Number(amount) || 0) + (Number(adminFee) || 0);
  const isInsufficient = totalDeduction > (Number(sourceWallet?.balance) || 0);
  const isSameWallet = sourceWalletId === targetWalletId;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSameWallet || isInsufficient || !amount || Number(amount) <= 0) return;

    onTransfer({
      sourceWalletId,
      targetWalletId,
      amount: Number(amount),
      adminFee: Number(adminFee) || 0,
      notes,
    });

    setAmount('');
    setAdminFee('0');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col pb-safe">
        
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Transfer Antar Dompet</h3>
            <p className="text-xs text-slate-500">Pindah saldo tanpa tercatat ganda</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Source to Target Wallet Visual */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dari Dompet (Asal)</span>
              <select
                value={sourceWalletId}
                onChange={(e) => setSourceWalletId(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Tersedia: Rp {Number(w.balance).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-1">
              <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ArrowRight size={16} />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ke Dompet (Tujuan)</span>
              <select
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === sourceWalletId}>
                    {w.name} {w.id === sourceWalletId ? '(Sama dengan asal)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input with Thousand Separator */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nominal Transfer (IDR)</label>
            <CurrencyInput
              required
              placeholder="0"
              value={amount}
              onChange={setAmount}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Admin Fee & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Biaya Admin (IDR)</label>
              <CurrencyInput
                showPrefix={false}
                placeholder="0"
                value={adminFee}
                onChange={setAdminFee}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Catatan</label>
              <input
                type="text"
                placeholder="Contoh: Top-up e-wallet"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Validation Warning */}
          {isSameWallet && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
              <AlertCircle size={16} />
              <span>Dompet asal dan tujuan tidak boleh sama.</span>
            </div>
          )}

          {isInsufficient && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
              <AlertCircle size={16} />
              <span>Saldo tidak cukup (Butuh: Rp {totalDeduction.toLocaleString('id-ID')}).</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSameWallet || isInsufficient || !amount || Number(amount) <= 0}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Eksekusi Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
