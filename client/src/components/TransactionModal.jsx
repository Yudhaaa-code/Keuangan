import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Plus, Repeat, Users } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function TransactionModal({
  isOpen,
  onClose,
  wallets,
  onSave,
  initialData = null,
  customCategories = { EXPENSE: [], INCOME: [] },
  onAddCategory,
}) {
  const [type, setType] = useState('EXPENSE');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState('Makan & Minum');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Split Bill / Patungan states
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [splitPersonName, setSplitPersonName] = useState('');
  const [splitAmount, setSplitAmount] = useState('');

  const defaultExpenseCategories = [
    'Makan & Minum',
    'Transportasi',
    'Kebutuhan Rumah',
    'Belanja',
    'Tagihan & Langganan',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Lainnya',
  ];
  const defaultIncomeCategories = [
    'Gaji Pokok',
    'Bonus & THR',
    'Freelance / Proyek',
    'Investasi / Deviden',
    'Penjualan Aset',
    'Hadiah / Uang Masuk',
  ];

  const categories = type === 'EXPENSE'
    ? [...new Set([...defaultExpenseCategories, ...(customCategories.EXPENSE || [])])]
    : [...new Set([...defaultIncomeCategories, ...(customCategories.INCOME || [])])];

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'EXPENSE');
      setWalletId(initialData.walletId || wallets[0]?.id || '');
      setCategory(initialData.category || 'Makan & Minum');
      setAmount(String(initialData.amount || ''));
      setDescription(initialData.description || '');
      setDate(
        initialData.rawDate ||
        (initialData.date && /^\d{4}-\d{2}-\d{2}/.test(initialData.date)
          ? initialData.date.slice(0, 10)
          : new Date().toISOString().split('T')[0])
      );
      setIsRecurring(Boolean(initialData.isRecurring));
    } else {
      setType('EXPENSE');
      setWalletId(wallets[0]?.id || '');
      setCategory('Makan & Minum');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
    }
    setIsSplitBill(false);
    setSplitPersonName('');
    setSplitAmount('');
    setShowAddCategory(false);
    setNewCategoryName('');
  }, [initialData, isOpen, wallets]);

  if (!isOpen) return null;

  const handleAddCustomCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      onAddCategory(type, trimmed);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    onSave({
      id: initialData?.id,
      walletId: walletId || wallets[0]?.id,
      type,
      category,
      amount: Number(amount),
      description,
      date,
      rawDate: date,
      isRecurring,
      splitBill:
        type === 'EXPENSE' && !initialData && isSplitBill && splitPersonName.trim() && Number(splitAmount) > 0
          ? {
              personName: splitPersonName.trim(),
              amount: Number(splitAmount),
            }
          : null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col pb-safe">
        
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => { setType('EXPENSE'); setCategory('Makan & Minum'); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight size={16} />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => { setType('INCOME'); setCategory('Gaji Pokok'); setIsSplitBill(false); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* Amount Input with Auto Thousand Separator */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nominal (IDR)</label>
            <CurrencyInput
              required
              placeholder="0"
              value={amount}
              onChange={setAmount}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {/* Quick Nominal Chips for Mobile One-Tap */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[15000, 25000, 50000, 100000, 250000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String((Number(amount) || 0) + preset))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  +{(preset / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Sumber Dompet</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {Number(w.balance).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* Category + Custom Category Builder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase">Kategori</label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Tambah Kategori</span>
              </button>
            </div>

            {showAddCategory ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-indigo-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            ) : null}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Keterangan</label>
              <input
                type="text"
                placeholder="Contoh: Kopi pagi / Makan siang"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Split Bill / Patungan Teman Toggle (Only for New Expense) */}
          {type === 'EXPENSE' && !initialData && (
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Patungan / Split Bill Teman</span>
                    <span className="text-[11px] text-slate-500">Otomatis catat bagian teman ke daftar Piutang</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSplitBill}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsSplitBill(checked);
                    if (checked && Number(amount) > 0 && !splitAmount) {
                      setSplitAmount(String(Math.round(Number(amount) / 2)));
                    }
                  }}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              {isSplitBill && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nama Teman yang Ditalangi</label>
                    <input
                      type="text"
                      required={isSplitBill}
                      placeholder="Contoh: Andi / Rina"
                      value={splitPersonName}
                      onChange={(e) => setSplitPersonName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Nominal Bagian Teman (Piutang)</label>
                      {Number(amount) > 0 && (
                        <button
                          type="button"
                          onClick={() => setSplitAmount(String(Math.round(Number(amount) / 2)))}
                          className="text-[10px] font-extrabold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Bagi 50:50 (Rp {Math.round(Number(amount) / 2).toLocaleString('id-ID')})
                        </button>
                      )}
                    </div>
                    <CurrencyInput
                      required={isSplitBill}
                      placeholder="0"
                      value={splitAmount}
                      onChange={setSplitAmount}
                      className="w-full pl-11 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-extrabold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recurring Toggle */}
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Repeat size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Transaksi Rutin / Berulang</span>
                <span className="text-[11px] text-slate-500">Tandai sebagai tagihan atau pemasukan bulanan</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </label>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {initialData ? 'Simpan Perubahan' : isSplitBill ? 'Simpan Transaksi & Catat Piutang' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
