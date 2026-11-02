import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  ArrowLeftRight, 
  PlusCircle, 
  CreditCard, 
  Wallet as WalletIcon,
  ShoppingBag,
  Briefcase,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ScanLine,
  Search,
  Calendar,
  Download,
  Pencil,
  Trash2,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  Plus,
  Landmark,
  X,
  User as UserIcon,
  CalendarDays,
  List,
  MessageCircle
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import TransferModal from '../components/TransferModal';
import ReceiptScannerModal from '../components/ReceiptScannerModal';
import WalletModal from '../components/WalletModal';
import CurrencyInput from '../components/CurrencyInput';
import { apiRequest } from '../utils/api';

const INITIAL_WALLETS = [
  { id: 'w-1', name: 'BCA Prioritas', type: 'BANK', balance: 32500000, colorHex: 'bg-blue-600', textBadge: 'BANK' },
  { id: 'w-2', name: 'GoPay & OVO', type: 'E_WALLET', balance: 3450000, colorHex: 'bg-emerald-600', textBadge: 'E-WALLET' },
  { id: 'w-3', name: 'Dompet Tunai', type: 'CASH', balance: 1200000, colorHex: 'bg-amber-600', textBadge: 'TUNAI' },
  { id: 'w-4', name: 'Bibit (Reksadana)', type: 'INVESTMENT', balance: 18500000, colorHex: 'bg-indigo-600', textBadge: 'INVEST' },
];

const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7); // YYYY-MM
const getTodayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-101',
    description: 'Gaji Bulanan Software Engineer',
    category: 'Gaji Pokok',
    walletId: 'w-1',
    walletName: 'BCA Prioritas',
    type: 'INCOME',
    amount: 18000000,
    date: getTodayStr(),
    rawDate: getTodayStr(),
    isRecurring: true,
  },
  {
    id: 'tx-102',
    description: 'Belanja Mingguan Superindo',
    category: 'Belanja',
    walletId: 'w-2',
    walletName: 'GoPay & OVO',
    type: 'EXPENSE',
    amount: 450000,
    date: getTodayStr(),
    rawDate: getTodayStr(),
    isRecurring: false,
  },
  {
    id: 'tx-103',
    description: 'Transfer ke GoPay untuk jajan',
    category: 'Transfer Saldo',
    walletId: 'w-1',
    targetWalletId: 'w-2',
    walletName: 'BCA Prioritas',
    type: 'TRANSFER',
    amount: 500000,
    adminFee: 2500,
    date: getTodayStr(),
    rawDate: getTodayStr(),
    isRecurring: false,
  },
  {
    id: 'tx-104',
    description: 'Langganan Cloud & Internet',
    category: 'Tagihan & Langganan',
    walletId: 'w-1',
    walletName: 'BCA Prioritas',
    type: 'EXPENSE',
    amount: 350000,
    date: getTodayStr(),
    rawDate: getTodayStr(),
    isRecurring: true,
  },
];

const INITIAL_BUDGETS = [
  { id: 'bg-1', category: 'Makan & Minum', limit: 2500000 },
  { id: 'bg-2', category: 'Belanja', limit: 1500000 },
  { id: 'bg-3', category: 'Tagihan & Langganan', limit: 1000000 },
  { id: 'bg-4', category: 'Transportasi', limit: 800000 },
];

const INITIAL_DEBTS = [
  {
    id: 'db-1',
    type: 'RECEIVABLE',
    personName: 'Budi Santoso (Pinjam Uang Makan)',
    totalAmount: 500000,
    paidAmount: 200000,
    dueDate: getTodayStr(),
    status: 'PARTIALLY_PAID',
    notes: 'Sisa Rp 300rb janji akhir bulan',
  },
  {
    id: 'db-2',
    type: 'PAYABLE',
    personName: 'Cicilan Kartu Kredit BCA',
    totalAmount: 1450000,
    paidAmount: 0,
    dueDate: getTodayStr(),
    status: 'UNPAID',
    notes: 'Tagihan bulanan',
  },
];

const INITIAL_GOALS = [
  {
    id: 'gl-1',
    name: 'Dana Darurat 2026',
    targetAmount: 30000000,
    currentAmount: 19500000,
    deadline: '2026-12-31',
    colorHex: '#10B981',
  },
  {
    id: 'gl-2',
    name: 'Liburan Akhir Tahun',
    targetAmount: 10000000,
    currentAmount: 4500000,
    deadline: '2026-12-15',
    colorHex: '#6366F1',
  },
];

const INITIAL_ASSETS = [
  {
    id: 'as-1',
    name: 'Emas Antam (Logam Mulia)',
    category: 'GOLD',
    quantity: 10,
    buyPrice: 12000000,
    currentValue: 14500000,
  },
  {
    id: 'as-2',
    name: 'BBCA - Bank Central Asia Tbk',
    category: 'STOCK',
    quantity: 20,
    buyPrice: 18000000,
    currentValue: 20400000,
  },
];

function normalizeTxDate(tx) {
  if (tx.rawDate && /^\d{4}-\d{2}-\d{2}/.test(tx.rawDate)) return tx.rawDate.slice(0, 10);
  if (tx.date && /^\d{4}-\d{2}-\d{2}/.test(tx.date)) return tx.date.slice(0, 10);
  return getTodayStr();
}

export default function Dashboard({ user, hideBalance, setHideBalance, onAlertsChange, onOpenAuth }) {
  // Navigation Tab: 'TRANSACTIONS' | 'BUDGETS' | 'DEBTS' | 'GOALS_ASSETS'
  const [activeTab, setActiveTab] = useState('TRANSACTIONS');

  // Kunci penyimpanan terpisah untuk setiap akun email
  const userScope = (user?.email || 'yudhae@keuangan.app').toLowerCase();
  const isDefaultUser = userScope === 'yudhae@keuangan.app';
  const storageKeys = {
    wallets: isDefaultUser ? 'keuangan_wallets_v2' : `keuangan_wallets_${userScope}`,
    transactions: isDefaultUser ? 'keuangan_transactions_v2' : `keuangan_transactions_${userScope}`,
    budgets: isDefaultUser ? 'keuangan_budgets_v1' : `keuangan_budgets_${userScope}`,
    debts: isDefaultUser ? 'keuangan_debts_v1' : `keuangan_debts_${userScope}`,
    goals: isDefaultUser ? 'keuangan_goals_v1' : `keuangan_goals_${userScope}`,
    assets: isDefaultUser ? 'keuangan_assets_v1' : `keuangan_assets_${userScope}`,
    categories: isDefaultUser ? 'keuangan_custom_categories_v1' : `keuangan_categories_${userScope}`,
  };

  // Core States with safe localStorage persistence per user account
  const [wallets, setWallets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.wallets);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser
      ? INITIAL_WALLETS
      : [{ id: `w-init-${Date.now()}`, name: 'Dompet Utama', type: 'CASH', balance: 0, colorHex: 'bg-indigo-600', textBadge: 'TUNAI' }];
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.transactions);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => ({ ...t, rawDate: normalizeTxDate(t) }));
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser ? INITIAL_TRANSACTIONS : [];
  });

  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.budgets);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser ? INITIAL_BUDGETS : [];
  });

  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.debts);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser ? INITIAL_DEBTS : [];
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.goals);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser ? INITIAL_GOALS : [];
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.assets);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return isDefaultUser ? INITIAL_ASSETS : [];
  });

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.categories);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return { EXPENSE: [], INCOME: [] };
  });

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [searchQuery, setSearchQuery] = useState('');
  const [txViewMode, setTxViewMode] = useState('LIST'); // 'LIST' | 'CALENDAR'
  const [selectedDayFilter, setSelectedDayFilter] = useState(null); // 'YYYY-MM-DD' | null
  const [selectedWalletFilter, setSelectedWalletFilter] = useState(null); // walletId | null

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Mobile-friendly Bottom Action Sheet state (replaces window.prompt & window.confirm)
  // { mode: 'PAY_DEBT' | 'CONTRIBUTE_GOAL' | 'UPDATE_ASSET' | 'DELETE_TX', target: object }
  const [actionSheet, setActionSheet] = useState(null);
  const [actionInputAmount, setActionInputAmount] = useState('');

  // Inline forms for Budgets, Debts, Goals, Assets
  const [budgetCategory, setBudgetCategory] = useState('Makan & Minum');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [debtType, setDebtType] = useState('PAYABLE');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState(getTodayStr());
  const [debtNotes, setDebtNotes] = useState('');
  const [debtPayWalletId, setDebtPayWalletId] = useState(wallets[0]?.id || '');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('GOLD');
  const [assetBuyPrice, setAssetBuyPrice] = useState('');
  const [assetCurrentValue, setAssetCurrentValue] = useState('');

  // Persist to localStorage per user account
  useEffect(() => { localStorage.setItem(storageKeys.wallets, JSON.stringify(wallets)); }, [wallets, storageKeys.wallets]);
  useEffect(() => { localStorage.setItem(storageKeys.transactions, JSON.stringify(transactions)); }, [transactions, storageKeys.transactions]);
  useEffect(() => { localStorage.setItem(storageKeys.budgets, JSON.stringify(budgets)); }, [budgets, storageKeys.budgets]);
  useEffect(() => { localStorage.setItem(storageKeys.debts, JSON.stringify(debts)); }, [debts, storageKeys.debts]);
  useEffect(() => { localStorage.setItem(storageKeys.goals, JSON.stringify(goals)); }, [goals, storageKeys.goals]);
  useEffect(() => { localStorage.setItem(storageKeys.assets, JSON.stringify(assets)); }, [assets, storageKeys.assets]);
  useEffect(() => { localStorage.setItem(storageKeys.categories, JSON.stringify(customCategories)); }, [customCategories, storageKeys.categories]);

  // Initial sync attempt with backend API if server is running
  useEffect(() => {
    (async () => {
      const resWallets = await apiRequest('/wallets');
      if (resWallets?.success && Array.isArray(resWallets.data) && resWallets.data.length > 0) {
        setWallets(
          resWallets.data.map((w) => ({
            ...w,
            balance: Number(w.balance),
            colorHex: w.colorHex?.startsWith('bg-') ? w.colorHex : 'bg-indigo-600',
            textBadge: w.type,
          }))
        );
      }
    })();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const formatCurrency = (val) => {
    if (hideBalance) return '••••••••';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Available months for filter dropdown
  const availableMonths = useMemo(() => {
    const set = new Set([getCurrentMonthStr()]);
    transactions.forEach((t) => {
      const d = normalizeTxDate(t);
      if (d && d.length >= 7) set.add(d.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Period-filtered transactions
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedMonth === 'ALL') return true;
      const d = normalizeTxDate(t);
      return d.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Summary calculations
  const totalWalletBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const totalAssetsValue = assets.reduce((acc, a) => acc + (Number(a.currentValue) || 0), 0);
  const totalUnpaidPayable = debts
    .filter((d) => d.type === 'PAYABLE' && d.status !== 'PAID')
    .reduce((acc, d) => acc + Math.max(0, (Number(d.totalAmount) || 0) - (Number(d.paidAmount) || 0)), 0);
  const totalNetWorth = totalWalletBalance + totalAssetsValue - totalUnpaidPayable;

  const monthlyIncome = periodTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const monthlyExpense = periodTransactions.reduce((acc, t) => {
    if (t.type === 'EXPENSE') return acc + (Number(t.amount) || 0);
    if (t.type === 'TRANSFER' && Number(t.adminFee) > 0) return acc + Number(t.adminFee);
    return acc;
  }, 0);

  const netSavings = monthlyIncome - monthlyExpense;

  // Month-over-Month (MoM) Expense Comparison
  const momComparison = useMemo(() => {
    const activeYm = selectedMonth === 'ALL' ? getCurrentMonthStr() : selectedMonth;
    const [yrStr, moStr] = activeYm.split('-');
    const yr = Number(yrStr);
    const mo = Number(moStr);
    if (!yr || !mo) return null;

    const prevDate = new Date(yr, mo - 2, 1);
    const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevExpense = transactions.reduce((acc, t) => {
      const d = normalizeTxDate(t);
      if (!d.startsWith(prevYm)) return acc;
      if (t.type === 'EXPENSE') return acc + (Number(t.amount) || 0);
      if (t.type === 'TRANSFER' && Number(t.adminFee) > 0) return acc + Number(t.adminFee);
      return acc;
    }, 0);

    if (prevExpense <= 0) {
      return { prevYm, prevExpense: 0, diffPct: null };
    }
    const diffPct = Math.round(((monthlyExpense - prevExpense) / prevExpense) * 100);
    return { prevYm, prevExpense, diffPct };
  }, [transactions, selectedMonth, monthlyExpense]);

  // Daily Expense Heat Calendar Data
  const calendarMonthData = useMemo(() => {
    const activeYm = selectedMonth === 'ALL' ? getCurrentMonthStr() : selectedMonth;
    const [yrStr, moStr] = activeYm.split('-');
    const yr = Number(yrStr);
    const mo = Number(moStr);
    if (!yr || !mo) return { activeYm, days: [], firstDayOffset: 0 };

    const daysInMonth = new Date(yr, mo, 0).getDate();
    // Monday-first offset (0 = Sen, 6 = Min)
    const rawFirstDay = new Date(yr, mo - 1, 1).getDay();
    const firstDayOffset = (rawFirstDay + 6) % 7;

    const dayMap = {};
    transactions.forEach((t) => {
      const d = normalizeTxDate(t);
      if (!d.startsWith(activeYm)) return;
      if (!dayMap[d]) dayMap[d] = { expense: 0, income: 0, count: 0 };
      if (t.type === 'EXPENSE') {
        dayMap[d].expense += Number(t.amount) || 0;
        dayMap[d].count += 1;
      } else if (t.type === 'TRANSFER' && Number(t.adminFee) > 0) {
        dayMap[d].expense += Number(t.adminFee);
        dayMap[d].count += 1;
      } else if (t.type === 'INCOME') {
        dayMap[d].income += Number(t.amount) || 0;
        dayMap[d].count += 1;
      }
    });

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${activeYm}-${String(day).padStart(2, '0')}`;
      const info = dayMap[dateStr] || { expense: 0, income: 0, count: 0 };
      days.push({
        day,
        dateStr,
        ...info,
      });
    }

    return { activeYm, days, firstDayOffset };
  }, [transactions, selectedMonth]);

  // Category Breakdown for visual analytics
  const categoryBreakdown = useMemo(() => {
    const map = {};
    periodTransactions.forEach((t) => {
      if (t.type === 'EXPENSE') {
        const cat = t.category || 'Lainnya';
        map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
      } else if (t.type === 'TRANSFER' && Number(t.adminFee) > 0) {
        map['Biaya Admin Transfer'] = (map['Biaya Admin Transfer'] || 0) + Number(t.adminFee);
      }
    });
    const entries = Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    return entries;
  }, [periodTransactions, monthlyExpense]);

  // Dynamic Smart Notifications pushed to Navbar
  useEffect(() => {
    if (!onAlertsChange) return;
    const generatedAlerts = [];

    budgets.forEach((b) => {
      const spent = periodTransactions
        .filter((t) => t.type === 'EXPENSE' && t.category === b.category)
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      if (pct >= 80) {
        generatedAlerts.push({
          id: `alert-budget-${b.id}-${pct >= 100 ? 'over' : 'warn'}`,
          title: pct >= 100 ? `Anggaran ${b.category} Terlampaui!` : `Waspada Anggaran ${b.category}`,
          message: `Pengeluaran ${b.category} telah mencapai ${pct}% (Rp ${spent.toLocaleString('id-ID')} dari batas Rp ${Number(b.limit).toLocaleString('id-ID')}).`,
          type: 'BUDGET_ALERT',
          time: 'Bulan berjalan',
        });
      }
    });

    debts
      .filter((d) => d.status !== 'PAID')
      .forEach((d) => {
        const remaining = (Number(d.totalAmount) || 0) - (Number(d.paidAmount) || 0);
        generatedAlerts.push({
          id: `alert-debt-${d.id}`,
          title: d.type === 'PAYABLE' ? `Pengingat Utang: ${d.personName}` : `Piutang Belum Lunas: ${d.personName}`,
          message: `Sisa ${d.type === 'PAYABLE' ? 'tagihan' : 'piutang'} Rp ${remaining.toLocaleString('id-ID')}${d.dueDate ? ` • Jatuh tempo: ${d.dueDate}` : ''}.`,
          type: 'DUE_DATE',
          time: d.dueDate || 'Aktif',
        });
      });

    const recurringCount = transactions.filter((t) => t.isRecurring).length;
    if (recurringCount > 0) {
      generatedAlerts.push({
        id: 'alert-recurring-summary',
        title: `${recurringCount} Transaksi Rutin / Langganan Aktif`,
        message: 'Tagihan dan pemasukan berulang Anda tercatat otomatis di riwayat transaksi.',
        type: 'RECURRING',
        time: 'Otomatis',
      });
    }

    onAlertsChange(generatedAlerts);
  }, [budgets, debts, periodTransactions, transactions, onAlertsChange]);

  // ========================
  // WALLET HANDLERS
  // ========================
  const handleSaveWallet = async (walletData) => {
    if (walletData.id) {
      setWallets((prev) =>
        prev.map((w) => (w.id === walletData.id ? { ...w, ...walletData } : w))
      );
      await apiRequest(`/wallets/${walletData.id}`, {
        method: 'PUT',
        body: JSON.stringify(walletData),
      });
      showToast(`Dompet "${walletData.name}" berhasil diperbarui!`);
    } else {
      const newWallet = {
        ...walletData,
        id: `w-${Date.now()}`,
      };
      setWallets((prev) => [...prev, newWallet]);
      await apiRequest('/wallets', {
        method: 'POST',
        body: JSON.stringify(walletData),
      });
      showToast(`Dompet "${walletData.name}" berhasil ditambahkan!`);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (wallets.length <= 1) {
      showToast('Minimal harus ada 1 dompet aktif.');
      return;
    }
    setWallets((prev) => prev.filter((w) => w.id !== walletId));
    await apiRequest(`/wallets/${walletId}`, { method: 'DELETE' });
    showToast('Dompet berhasil dihapus.');
  };

  // ========================
  // TRANSACTION HANDLERS
  // ========================
  const handleSaveTransaction = async ({ id, walletId, type, category, amount, description, date, isRecurring, splitBill }) => {
    const numericAmount = Number(amount) || 0;
    const cleanDate = date || getTodayStr();

    if (id) {
      const oldTx = transactions.find((t) => t.id === id);
      if (!oldTx) return;

      const tempWallets = wallets.map((w) => {
        let bal = Number(w.balance) || 0;
        if (w.id === oldTx.walletId) {
          bal = oldTx.type === 'INCOME' ? bal - Number(oldTx.amount) : bal + Number(oldTx.amount);
        }
        if (w.id === walletId) {
          bal = type === 'INCOME' ? bal + numericAmount : bal - numericAmount;
        }
        return { ...w, balance: bal };
      });

      const targetWallet = tempWallets.find((w) => w.id === walletId);
      if (type === 'EXPENSE' && targetWallet && targetWallet.balance < 0) {
        showToast(`Saldo dompet ${targetWallet.name} tidak mencukupi!`);
        return;
      }

      setWallets(tempWallets);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                walletId,
                walletName: targetWallet?.name || t.walletName,
                type,
                category,
                amount: numericAmount,
                description: description || (type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'),
                date: cleanDate,
                rawDate: cleanDate,
                isRecurring: Boolean(isRecurring),
              }
            : t
        )
      );

      await apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ walletId, type, category, amount: numericAmount, description, date: cleanDate, isRecurring }),
      });

      setEditingTx(null);
      showToast('Transaksi & saldo dompet berhasil diperbarui!');
      return;
    }

    const selectedWallet = wallets.find((w) => w.id === walletId) || wallets[0];

    if (type === 'EXPENSE' && Number(selectedWallet.balance) < numericAmount) {
      showToast(`Saldo dompet ${selectedWallet.name} tidak mencukupi!`);
      return;
    }

    const updatedWallets = wallets.map((w) => {
      if (w.id === selectedWallet.id) {
        const newBalance =
          type === 'INCOME'
            ? Number(w.balance) + numericAmount
            : Number(w.balance) - numericAmount;
        return { ...w, balance: newBalance };
      }
      return w;
    });

    const newTx = {
      id: `tx-${Date.now()}`,
      description: description || (type === 'INCOME' ? 'Pemasukan Baru' : 'Pengeluaran Baru'),
      category: category || 'Umum',
      walletId: selectedWallet.id,
      walletName: selectedWallet.name,
      type: type || 'EXPENSE',
      amount: numericAmount,
      date: cleanDate,
      rawDate: cleanDate,
      isRecurring: Boolean(isRecurring),
    };

    setWallets(updatedWallets);
    setTransactions([newTx, ...transactions]);

    // Jika mengaktifkan Split Bill / Patungan Teman, otomatis catat ke Piutang (RECEIVABLE)
    if (splitBill && splitBill.personName && Number(splitBill.amount) > 0) {
      const splitDebt = {
        id: `db-split-${Date.now()}`,
        type: 'RECEIVABLE',
        personName: `${splitBill.personName} (Patungan: ${newTx.description})`,
        totalAmount: Number(splitBill.amount),
        paidAmount: 0,
        dueDate: cleanDate,
        status: 'UNPAID',
        notes: `Otomatis dari Split Bill transaksi Rp ${numericAmount.toLocaleString('id-ID')}`,
      };
      setDebts((prev) => [splitDebt, ...prev]);
    }

    await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        walletId: selectedWallet.id,
        type,
        amount: numericAmount,
        description: newTx.description,
        date: cleanDate,
        isRecurring,
      }),
    });

    if (splitBill && splitBill.personName && Number(splitBill.amount) > 0) {
      showToast(
        `Transaksi dicatat & Piutang ${splitBill.personName} (Rp ${Number(splitBill.amount).toLocaleString('id-ID')}) otomatis dibuat!`
      );
    } else {
      showToast(`Transaksi Rp ${numericAmount.toLocaleString('id-ID')} berhasil dicatat!`);
    }
  };

  const executeDeleteTransaction = async (tx) => {
    const updatedWallets = wallets.map((w) => {
      if (tx.type === 'TRANSFER') {
        const fee = Number(tx.adminFee) || 0;
        if (w.id === tx.walletId) {
          return { ...w, balance: Number(w.balance) + Number(tx.amount) + fee };
        }
        if (tx.targetWalletId && w.id === tx.targetWalletId) {
          return { ...w, balance: Math.max(0, Number(w.balance) - Number(tx.amount)) };
        }
        return w;
      }

      if (w.id === tx.walletId) {
        const restored =
          tx.type === 'INCOME'
            ? Number(w.balance) - Number(tx.amount)
            : Number(w.balance) + Number(tx.amount);
        return { ...w, balance: restored };
      }
      return w;
    });

    setWallets(updatedWallets);
    setTransactions((prev) => prev.filter((item) => item.id !== tx.id));
    setActionSheet(null);
    await apiRequest(`/transactions/${tx.id}`, { method: 'DELETE' });
    showToast('Transaksi dihapus & saldo dompet dikembalikan.');
  };

  const handleTransfer = async ({ sourceWalletId, targetWalletId, amount, adminFee = 0, notes }) => {
    const numAmount = Number(amount) || 0;
    const numFee = Number(adminFee) || 0;
    const totalDeduct = numAmount + numFee;

    const sourceWallet = wallets.find((w) => w.id === sourceWalletId);
    const targetWallet = wallets.find((w) => w.id === targetWalletId);

    if (!sourceWallet || !targetWallet) return;
    if (Number(sourceWallet.balance) < totalDeduct) {
      showToast(`Saldo dompet ${sourceWallet.name} tidak cukup.`);
      return;
    }

    const updatedWallets = wallets.map((w) => {
      if (w.id === sourceWalletId) {
        return { ...w, balance: Number(w.balance) - totalDeduct };
      }
      if (w.id === targetWalletId) {
        return { ...w, balance: Number(w.balance) + numAmount };
      }
      return w;
    });

    const today = getTodayStr();
    const newTx = {
      id: `tx-tf-${Date.now()}`,
      description: `Transfer ke ${targetWallet.name} ${notes ? `(${notes})` : ''}`.trim(),
      category: 'Transfer Saldo',
      walletId: sourceWalletId,
      targetWalletId,
      walletName: sourceWallet.name,
      type: 'TRANSFER',
      amount: numAmount,
      adminFee: numFee,
      date: today,
      rawDate: today,
      isRecurring: false,
    };

    setWallets(updatedWallets);
    setTransactions([newTx, ...transactions]);

    await apiRequest('/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify({ sourceWalletId, targetWalletId, amount: numAmount, adminFee: numFee, notes }),
    });

    showToast(`Transfer Rp ${numAmount.toLocaleString('id-ID')} berhasil diproses!`);
  };

  const handleAddCustomCategory = (type, name) => {
    setCustomCategories((prev) => ({
      ...prev,
      [type]: [...new Set([...(prev[type] || []), name])],
    }));
    showToast(`Kategori "${name}" ditambahkan!`);
  };

  // ========================
  // EXPORT CSV HANDLER
  // ========================
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Dompet', 'Tipe', 'Nominal (IDR)', 'Biaya Admin (IDR)', 'Rutin'];
    const rows = filteredTransactions.map((t) => [
      normalizeTxDate(t),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.walletName || ''}"`,
      t.type,
      t.amount,
      t.adminFee || 0,
      t.isRecurring ? 'Ya' : 'Tidak',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan transaksi berhasil diunduh ke CSV!');
  };

  // ========================
  // BUDGET, DEBT, GOAL, ASSET HANDLERS
  // ========================
  const handleSaveBudget = (e) => {
    e.preventDefault();
    const limitNum = Number(budgetLimit);
    if (!budgetCategory || !limitNum || limitNum <= 0) return;

    setBudgets((prev) => {
      const exists = prev.find((b) => b.category === budgetCategory);
      if (exists) {
        return prev.map((b) => (b.category === budgetCategory ? { ...b, limit: limitNum } : b));
      }
      return [...prev, { id: `bg-${Date.now()}`, category: budgetCategory, limit: limitNum }];
    });
    setBudgetLimit('');
    showToast(`Anggaran "${budgetCategory}" disimpan!`);
  };

  const handleAddDebt = (e) => {
    e.preventDefault();
    const total = Number(debtAmount);
    if (!debtPerson.trim() || !total || total <= 0) return;

    const newDebt = {
      id: `db-${Date.now()}`,
      type: debtType,
      personName: debtPerson.trim(),
      totalAmount: total,
      paidAmount: 0,
      dueDate: debtDueDate,
      status: 'UNPAID',
      notes: debtNotes.trim(),
    };
    setDebts([newDebt, ...debts]);
    setDebtPerson('');
    setDebtAmount('');
    setDebtNotes('');
    showToast(`Catatan ${debtType === 'PAYABLE' ? 'Utang' : 'Piutang'} berhasil ditambahkan!`);
  };

  const openPayDebtSheet = (debt) => {
    const remaining = Math.max(0, Number(debt.totalAmount) - Number(debt.paidAmount));
    setActionInputAmount(String(remaining));
    setActionSheet({ mode: 'PAY_DEBT', target: debt });
  };

  const openContributeGoalSheet = (goal) => {
    const remaining = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
    setActionInputAmount(String(Math.min(500000, remaining || 500000)));
    setActionSheet({ mode: 'CONTRIBUTE_GOAL', target: goal });
  };

  const openUpdateAssetSheet = (asset) => {
    setActionInputAmount(String(asset.currentValue));
    setActionSheet({ mode: 'UPDATE_ASSET', target: asset });
  };

  const handleActionSheetSubmit = (e) => {
    e.preventDefault();
    if (!actionSheet) return;
    const val = Number(actionInputAmount);

    if (actionSheet.mode === 'PAY_DEBT') {
      const debt = actionSheet.target;
      if (!val || val <= 0) return;
      const remaining = Math.max(0, Number(debt.totalAmount) - Number(debt.paidAmount));
      const actualPay = Math.min(remaining, val);
      const nextPaid = Number(debt.paidAmount) + actualPay;
      const nextStatus = nextPaid >= Number(debt.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

      const selectedW = wallets.find((w) => w.id === debtPayWalletId) || wallets[0];
      if (selectedW) {
        if (debt.type === 'PAYABLE' && Number(selectedW.balance) < actualPay) {
          showToast(`Saldo dompet ${selectedW.name} tidak mencukupi!`);
          return;
        }
        handleSaveTransaction({
          walletId: selectedW.id,
          type: debt.type === 'PAYABLE' ? 'EXPENSE' : 'INCOME',
          category: debt.type === 'PAYABLE' ? 'Tagihan & Langganan' : 'Hadiah / Uang Masuk',
          amount: actualPay,
          description: `${debt.type === 'PAYABLE' ? 'Bayar Utang' : 'Terima Pelunasan Piutang'}: ${debt.personName}`,
          date: getTodayStr(),
          isRecurring: false,
        });
      }

      setDebts((prev) =>
        prev.map((d) =>
          d.id === debt.id ? { ...d, paidAmount: nextPaid, status: nextStatus } : d
        )
      );
      setActionSheet(null);
      return;
    }

    if (actionSheet.mode === 'CONTRIBUTE_GOAL') {
      const goal = actionSheet.target;
      if (!val || val <= 0) return;

      if (debtPayWalletId && debtPayWalletId !== 'NONE') {
        const selectedW = wallets.find((w) => w.id === debtPayWalletId) || wallets[0];
        if (selectedW) {
          if (Number(selectedW.balance) < val) {
            showToast(`Saldo dompet ${selectedW.name} tidak mencukupi!`);
            return;
          }
          handleSaveTransaction({
            walletId: selectedW.id,
            type: 'EXPENSE',
            category: 'Tabungan & Investasi',
            amount: val,
            description: `Alokasi Target Tabungan: ${goal.name}`,
            date: getTodayStr(),
            isRecurring: false,
          });
        }
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, currentAmount: Number(g.currentAmount) + val } : g
        )
      );
      showToast(`Tabungan "${goal.name}" bertambah Rp ${val.toLocaleString('id-ID')}!`);
      setActionSheet(null);
      return;
    }

    if (actionSheet.mode === 'UPDATE_ASSET') {
      const asset = actionSheet.target;
      if (isNaN(val) || val < 0) return;
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, currentValue: val } : a))
      );
      showToast(`Nilai pasar "${asset.name}" diperbarui!`);
      setActionSheet(null);
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const target = Number(goalTarget);
    if (!goalName.trim() || !target || target <= 0) return;

    setGoals([
      ...goals,
      {
        id: `gl-${Date.now()}`,
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: 0,
        deadline: goalDeadline || '2026-12-31',
        colorHex: '#10B981',
      },
    ]);
    setGoalName('');
    setGoalTarget('');
    setGoalDeadline('');
    showToast(`Target "${goalName}" berhasil dibuat!`);
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    const buy = Number(assetBuyPrice);
    const curr = Number(assetCurrentValue || assetBuyPrice);
    if (!assetName.trim() || !buy || buy <= 0) return;

    setAssets([
      ...assets,
      {
        id: `as-${Date.now()}`,
        name: assetName.trim(),
        category: assetCategory,
        quantity: 1,
        buyPrice: buy,
        currentValue: curr,
      },
    ]);
    setAssetName('');
    setAssetBuyPrice('');
    setAssetCurrentValue('');
    showToast(`Aset investasi "${assetName}" berhasil dicatat!`);
  };

  // Kirim Pengingat Piutang / Split Bill ke WhatsApp (1-Klik)
  const handleShareWhatsAppReminder = (debt) => {
    const remaining = Math.max(0, Number(debt.totalAmount) - Number(debt.paidAmount));
    const rawTitle = (debt.personName || 'Teman').trim();
    const parenMatch = rawTitle.match(/^([^(]+)\(([^)]+)\)/);

    const cleanName = parenMatch ? parenMatch[1].trim() : rawTitle;
    const detailFromTitle = parenMatch ? parenMatch[2].trim() : '';
    const keterangan = detailFromTitle || (debt.notes ? debt.notes.trim() : 'Pinjaman / Patungan');

    const lines = [
      `Halo ${cleanName},`,
      `Izin mengingatkan untuk rincian patungan/piutang berikut ya:`,
      ``,
      `- Keterangan: ${keterangan}`,
      `- Nominal: *Rp ${remaining.toLocaleString('id-ID')}*`,
      ...(debt.dueDate ? [`- Tanggal/Tempo: ${debt.dueDate}`] : []),
      ``,
      `Kalau sudah sempat transfer atau ada konfirmasi, kabari saja ya. Terima kasih banyak sebelumnya!`,
    ];

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Daftar template Transaksi Rutin unik & mana yang belum dicatat pada bulan terpilih
  const recurringStatus = useMemo(() => {
    const activeYm = selectedMonth === 'ALL' ? getCurrentMonthStr() : selectedMonth;
    const uniqueMap = new Map();
    transactions.forEach((t) => {
      if (!t.isRecurring || t.type === 'TRANSFER') return;
      const key = `${t.type}::${(t.description || '').toLowerCase()}::${t.category}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      }
    });

    const templates = Array.from(uniqueMap.values());
    const pendingInMonth = templates.filter((tpl) => {
      return !transactions.some((tx) => {
        const d = normalizeTxDate(tx);
        return (
          d.startsWith(activeYm) &&
          tx.type === tpl.type &&
          (tx.description || '').toLowerCase() === (tpl.description || '').toLowerCase()
        );
      });
    });

    return { activeYm, templates, pendingInMonth };
  }, [transactions, selectedMonth]);

  // Eksekusi 1-Klik untuk mencatat ulang transaksi rutin ke bulan aktif / hari ini
  const handleRepeatTransaction = (tpl, customDateStr) => {
    const targetDate = customDateStr || getTodayStr();
    handleSaveTransaction({
      walletId: tpl.walletId,
      type: tpl.type,
      category: tpl.category,
      amount: Number(tpl.amount),
      description: tpl.description,
      date: targetDate,
      isRecurring: true,
    });
  };

  const handleExecuteAllPendingRecurring = () => {
    const { activeYm, pendingInMonth } = recurringStatus;
    if (pendingInMonth.length === 0) return;

    const targetDate = activeYm === getCurrentMonthStr() ? getTodayStr() : `${activeYm}-01`;
    let updatedWallets = [...wallets];
    const newTxs = [];

    pendingInMonth.forEach((tpl, idx) => {
      const numAmt = Number(tpl.amount) || 0;
      const wIdx = updatedWallets.findIndex((w) => w.id === tpl.walletId);
      const targetW = wIdx >= 0 ? updatedWallets[wIdx] : updatedWallets[0];
      if (!targetW) return;

      if (tpl.type === 'EXPENSE' && Number(targetW.balance) < numAmt) {
        return;
      }

      updatedWallets = updatedWallets.map((w) => {
        if (w.id === targetW.id) {
          return {
            ...w,
            balance: tpl.type === 'INCOME' ? Number(w.balance) + numAmt : Number(w.balance) - numAmt,
          };
        }
        return w;
      });

      newTxs.push({
        id: `tx-rec-${Date.now()}-${idx}`,
        description: tpl.description,
        category: tpl.category,
        walletId: targetW.id,
        walletName: targetW.name,
        type: tpl.type,
        amount: numAmt,
        date: targetDate,
        rawDate: targetDate,
        isRecurring: true,
      });
    });

    if (newTxs.length === 0) {
      showToast('Saldo dompet tidak mencukupi untuk mengeksekusi transaksi rutin.');
      return;
    }

    setWallets(updatedWallets);
    setTransactions((prev) => [...newTxs, ...prev]);
    showToast(`${newTxs.length} Transaksi Rutin berhasil dicatat otomatis untuk periode ${activeYm}!`);
  };

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((t) => {
      if (selectedWalletFilter && t.walletId !== selectedWalletFilter && t.targetWalletId !== selectedWalletFilter) {
        return false;
      }
      if (selectedDayFilter && normalizeTxDate(t) !== selectedDayFilter) return false;
      if (activeFilter !== 'ALL' && t.type !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchWal = (t.walletName || '').toLowerCase().includes(q);
        return matchDesc || matchCat || matchWal;
      }
      return true;
    });
  }, [periodTransactions, activeFilter, searchQuery, selectedDayFilter, selectedWalletFilter]);

  const renderTransactionIcon = (tx) => {
    if (tx.type === 'INCOME') return <Briefcase size={20} />;
    if (tx.type === 'TRANSFER') return <ArrowLeftRight size={20} />;
    if (tx.category === 'Transportasi') return <Zap size={20} />;
    return <ShoppingBag size={20} />;
  };

  const unpaidDebtCount = debts.filter((d) => d.status !== 'PAID').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Alert (positioned above mobile bottom nav bar on small screens) */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 w-full md:w-auto">
            <div className="flex items-center justify-between md:justify-start gap-2">
              <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                Total Kekayaan Bersih
              </span>
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
              >
                {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight break-all">{formatCurrency(totalNetWorth)}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-400 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                <span>Surplus: {formatCurrency(netSavings)}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-200">Dompet: {formatCurrency(totalWalletBalance)}</span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-200">Aset: {formatCurrency(totalAssetsValue)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/30 transition-all border border-violet-400/30 cursor-pointer"
            >
              <ScanLine size={18} />
              <span>Scan Struk</span>
            </button>

            <button
              onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/10 transition-all cursor-pointer"
            >
              <PlusCircle size={18} />
              <span>Catat Manual</span>
            </button>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeftRight size={18} />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </section>

      {/* Desktop Feature Navigation Tabs + Period Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Desktop Tabs (Hidden on mobile because mobile has Fixed Bottom Navigation Bar) */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          {[
            { id: 'TRANSACTIONS', label: 'Transaksi & Dompet', icon: WalletIcon },
            { id: 'BUDGETS', label: `Anggaran (${budgets.length})`, icon: PieChart },
            { id: 'DEBTS', label: `Utang & Piutang (${unpaidDebtCount})`, icon: HandCoins },
            { id: 'GOALS_ASSETS', label: 'Target & Aset Investasi', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Period / Month Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-500">Periode Laporan:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDayFilter(null);
            }}
            className="text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Waktu</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cash Flow Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <ArrowUpRight size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Pemasukan ({selectedMonth === 'ALL' ? 'Total' : selectedMonth})
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5 truncate">{formatCurrency(monthlyIncome)}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
            <ArrowDownRight size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Pengeluaran ({selectedMonth === 'ALL' ? 'Total' : selectedMonth})
              </span>
              {momComparison && momComparison.diffPct !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${
                    momComparison.diffPct <= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                  title={`Bulan lalu (${momComparison.prevYm}): Rp ${momComparison.prevExpense.toLocaleString('id-ID')}`}
                >
                  {momComparison.diffPct <= 0
                    ? `Hemat ${Math.abs(momComparison.diffPct)}% vs bln lalu`
                    : `Naik +${momComparison.diffPct}% vs bln lalu`}
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-rose-600 mt-0.5 truncate">{formatCurrency(monthlyExpense)}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Rasio Tabungan</span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {monthlyIncome > 0 ? `${Math.round((netSavings / monthlyIncome) * 100)}%` : '0%'}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* TAB 1: TRANSAKSI, MULTI-DOMPET, & ANALITIK KATEGORI        */}
      {/* ========================================================= */}
      {activeTab === 'TRANSACTIONS' && (
        <>
          {/* Multi-Wallet Grid with Add, Edit, & Click-to-Filter */}
          <section className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Multi-Dompet ({wallets.length})</h3>
                <p className="text-xs text-slate-500">Ketuk kartu dompet untuk memfilter mutasi rekening, atau ikon pensil untuk edit saldo.</p>
              </div>
              <button
                onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer flex-shrink-0"
              >
                <Plus size={15} />
                <span>Dompet Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {wallets.map((wallet) => {
                const isSelectedWallet = selectedWalletFilter === wallet.id;
                return (
                  <div 
                    key={wallet.id}
                    onClick={() => setSelectedWalletFilter(isSelectedWallet ? null : wallet.id)}
                    className={`bg-white p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${
                      isSelectedWallet
                        ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/20'
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${wallet.colorHex || 'bg-blue-600'}`}>
                        {wallet.type === 'BANK' ? <CreditCard size={20} /> : <WalletIcon size={20} />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelectedWallet && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-indigo-600 text-white rounded-lg">
                            Mutasi Aktif
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                          {wallet.textBadge || wallet.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingWallet(wallet);
                            setIsWalletModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Dompet / Sesuaikan Saldo"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-500 truncate">{wallet.name}</h4>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(wallet.balance)}</p>
                    {wallet.accountNumber && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">No: {wallet.accountNumber}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Visual Category Expense Breakdown */}
          {categoryBreakdown.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <PieChart size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Distribusi Pengeluaran per Kategori</h3>
                    <p className="text-xs text-slate-500">Pos pengeluaran terbesar ({selectedMonth === 'ALL' ? 'Semua Waktu' : selectedMonth})</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-rose-600">Total: {formatCurrency(monthlyExpense)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{item.category}</span>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(item.amount)} <span className="text-indigo-600">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(4, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transaction History, Daily Heat Calendar, Search, Filter, & CSV Export */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center justify-between w-full lg:w-auto gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Aktivitas Transaksi ({filteredTransactions.length})</h3>
                  <p className="text-xs text-slate-500">Cari, filter kalender harian, edit, hapus, & unduh CSV</p>
                </div>

                {/* View Mode Toggle (Daftar vs Kalender Harian) + Mobile CSV */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTxViewMode('LIST')}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        txViewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Tampilan Daftar"
                    >
                      <List size={14} />
                      <span className="hidden sm:inline">Daftar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxViewMode('CALENDAR')}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        txViewMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Kalender Pengeluaran Harian"
                    >
                      <CalendarDays size={14} />
                      <span>Kalender</span>
                    </button>
                  </div>

                  {/* Mobile Export CSV icon button */}
                  <button
                    onClick={handleExportCSV}
                    className="lg:hidden px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    title="Unduh CSV"
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-56">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kopi, gaji, BCA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                {/* Filter Pills */}
                <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                  {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-2.5 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                        activeFilter === f 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {f === 'ALL' ? 'Semua' : f === 'EXPENSE' ? 'Keluar' : f === 'INCOME' ? 'Masuk' : 'Transfer'}
                    </button>
                  ))}
                </div>

                {/* Desktop Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  className="hidden lg:flex px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
                  title="Unduh Laporan ke Excel / CSV"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Daily Expense Heat Calendar (Kalender Pengeluaran Harian) */}
            {txViewMode === 'CALENDAR' && (
              <div className="p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-3.5 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <CalendarDays size={16} className="text-indigo-600" />
                      <span>Kalender Pengeluaran Harian ({calendarMonthData.activeYm})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ketuk tanggal untuk memfilter transaksi pada hari tersebut.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      ● Hemat / Rp 0
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                      ● Normal (&le;150rb)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                      ● Tinggi (&gt;150rb)
                    </span>
                  </div>
                </div>

                {/* Day-of-week header */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] font-extrabold uppercase text-slate-400">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: calendarMonthData.firstDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-transparent" />
                  ))}
                  {calendarMonthData.days.map((item) => {
                    const isSelected = selectedDayFilter === item.dateStr;
                    const isToday = item.dateStr === getTodayStr();
                    const isHigh = item.expense > 150000;
                    const isModerate = item.expense > 0 && item.expense <= 150000;

                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDayFilter(isSelected ? null : item.dateStr)}
                        className={`h-14 sm:h-16 p-1 sm:p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/70'
                            : isHigh
                            ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                            : isModerate
                            ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                            : 'bg-white border-slate-200/80 hover:border-emerald-400'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[11px] font-extrabold ${
                            isToday ? 'px-1.5 py-0.2 rounded-md bg-indigo-600 text-white' : 'text-slate-700'
                          }`}>
                            {item.day}
                          </span>
                          {item.count > 0 && (
                            <span className="text-[9px] font-bold text-slate-400 hidden sm:inline">
                              {item.count}x
                            </span>
                          )}
                        </div>

                        <div className="w-full truncate">
                          {item.expense > 0 ? (
                            <span className={`text-[9px] sm:text-[10px] font-extrabold block truncate ${
                              isHigh ? 'text-rose-600' : 'text-amber-700'
                            }`}>
                              -{item.expense >= 1000000
                                ? `${(item.expense / 1000000).toFixed(1)}jt`
                                : `${Math.round(item.expense / 1000)}rb`}
                            </span>
                          ) : item.income > 0 ? (
                            <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 block truncate">
                              +{item.income >= 1000000
                                ? `${(item.income / 1000000).toFixed(1)}jt`
                                : `${Math.round(item.income / 1000)}rb`}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600/80 block truncate">
                              Rp 0
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Date Filter Banner */}
            {selectedDayFilter && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs">
                <span className="font-bold text-indigo-900">
                  Menampilkan transaksi pada tanggal: <strong>{selectedDayFilter}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter(null)}
                  className="font-extrabold text-indigo-600 hover:underline cursor-pointer"
                >
                  Tampilkan Semua Tanggal
                </button>
              </div>
            )}

            {/* Selected Wallet Filter Banner */}
            {selectedWalletFilter && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <WalletIcon size={14} className="text-indigo-600" />
                  <span>
                    Menampilkan mutasi rekening:{' '}
                    <strong>{wallets.find((w) => w.id === selectedWalletFilter)?.name || 'Dompet Terpilih'}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedWalletFilter(null)}
                  className="font-extrabold text-indigo-600 hover:underline cursor-pointer"
                >
                  Tampilkan Semua Dompet
                </button>
              </div>
            )}

            {/* 1-Click Pending Recurring Transactions Banner for New Month */}
            {recurringStatus.pendingInMonth.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 bg-violet-50/90 border border-violet-200 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                    <Repeat size={15} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block">
                      Ada {recurringStatus.pendingInMonth.length} Transaksi Rutin yang belum dicatat di periode {recurringStatus.activeYm}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      ({recurringStatus.pendingInMonth.map((t) => t.description).join(', ')})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteAllPendingRecurring}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
                >
                  <Repeat size={13} />
                  <span>+ Catat Otomatis Bulan Ini</span>
                </button>
              </div>
            )}

            {/* Transaction List */}
            <div className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-semibold">
                  Tidak ada transaksi yang cocok dengan filter atau pencarian ini.
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isExpense = tx.type === 'EXPENSE';

                  return (
                    <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 sm:px-3 rounded-2xl transition-colors">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isIncome ? 'bg-emerald-50 text-emerald-600' :
                          isExpense ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {renderTransactionIcon(tx)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-bold text-slate-900 break-words">{tx.description}</h5>
                            {tx.isRecurring && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600">
                                <Repeat size={10} /> Rutin
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-600">{tx.category}</span>
                            <span>•</span>
                            <span>{tx.walletName}</span>
                            <span>•</span>
                            <span>{normalizeTxDate(tx)}</span>
                            {Number(tx.adminFee) > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-500 font-semibold">
                                  +Admin {formatCurrency(tx.adminFee)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-14 sm:pl-0">
                        <div className="text-left sm:text-right">
                          <p className={`text-sm font-black ${
                            isIncome ? 'text-emerald-600' :
                            isExpense ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {isIncome ? '+' : isExpense ? '-' : ''} {formatCurrency(tx.amount)}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {tx.type}
                          </span>
                        </div>

                        {/* Action Buttons: Repeat Recurring, Edit & Delete */}
                        <div className="flex items-center gap-1">
                          {tx.isRecurring && tx.type !== 'TRANSFER' && (
                            <button
                              onClick={() => handleRepeatTransaction(tx)}
                              className="p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 bg-indigo-50/60 sm:bg-transparent transition-colors cursor-pointer"
                              title="Catat Ulang Transaksi Rutin Ini untuk Hari Ini"
                            >
                              <Repeat size={15} />
                            </button>
                          )}
                          {tx.type !== 'TRANSFER' && (
                            <button
                              onClick={() => { setEditingTx(tx); setIsTxModalOpen(true); }}
                              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 bg-slate-100/70 sm:bg-transparent hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setActionSheet({ mode: 'DELETE_TX', target: tx })}
                            className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 bg-slate-100/70 sm:bg-transparent hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Transaksi & Kembalikan Saldo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ANGGARAN BULANAN (BUDGETING)                       */}
      {/* ========================================================= */}
      {activeTab === 'BUDGETS' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Atur Pagu Anggaran</h3>
                <p className="text-xs text-slate-500">Batas pengeluaran bulanan per kategori</p>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kategori Pengeluaran</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  {[
                    'Makan & Minum',
                    'Transportasi',
                    'Kebutuhan Rumah',
                    'Belanja',
                    'Tagihan & Langganan',
                    'Hiburan',
                    'Kesehatan',
                    'Pendidikan',
                    'Lainnya',
                    ...(customCategories.EXPENSE || []),
                  ].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Batas Maksimal / Bulan (IDR)</label>
                <CurrencyInput
                  required
                  placeholder="Contoh: 2.000.000"
                  value={budgetLimit}
                  onChange={setBudgetLimit}
                  showPrefix={false}
                  inputClassName="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 text-xs cursor-pointer"
              >
                Simpan Batas Anggaran
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Realisasi Anggaran ({selectedMonth === 'ALL' ? 'Semua Waktu' : selectedMonth})</h3>
              <p className="text-xs text-slate-500">Dihitung otomatis dari transaksi pengeluaran Anda pada periode terpilih</p>
            </div>

            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = periodTransactions
                  .filter((t) => t.type === 'EXPENSE' && t.category === b.category)
                  .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
                const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
                const isOver = pct >= 100;
                const isWarn = pct >= 80 && pct < 100;

                return (
                  <div key={b.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900">{b.category}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                            isOver ? 'bg-rose-100 text-rose-700' :
                            isWarn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isOver ? 'Overbudget!' : isWarn ? 'Hampir Habis' : 'Aman'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Terpakai <strong className="text-slate-800">{formatCurrency(spent)}</strong> dari pagu {formatCurrency(b.limit)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${
                          isOver ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {pct}%
                        </span>
                        <button
                          onClick={() => setBudgets(budgets.filter((item) => item.id !== b.id))}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Hapus Anggaran"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-600' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: UTANG & PIUTANG (DEBT TRACKER)                     */}
      {/* ========================================================= */}
      {activeTab === 'DEBTS' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HandCoins size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Catat Utang / Piutang</h3>
                <p className="text-xs text-slate-500">Pantau cicilan & pinjaman teman</p>
              </div>
            </div>

            <form onSubmit={handleAddDebt} className="space-y-3.5">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDebtType('PAYABLE')}
                  className={`py-2.5 rounded-xl cursor-pointer ${
                    debtType === 'PAYABLE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Utang Saya
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('RECEIVABLE')}
                  className={`py-2.5 rounded-xl cursor-pointer ${
                    debtType === 'RECEIVABLE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Piutang Teman
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Orang / Instansi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi / Kredivo / KPR"
                  value={debtPerson}
                  onChange={(e) => setDebtPerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Nominal (IDR)</label>
                  <CurrencyInput
                    required
                    placeholder="500.000"
                    value={debtAmount}
                    onChange={setDebtAmount}
                    showPrefix={false}
                    inputClassName="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan singkat..."
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 text-xs cursor-pointer"
              >
                Simpan Catatan
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Daftar Utang & Piutang</h3>
              <p className="text-xs text-slate-500">Ketuk tombol Bayar/Cicil untuk membuka lembar pelunasan ramah HP</p>
            </div>

            <div className="space-y-3">
              {debts.map((d) => {
                const remaining = Math.max(0, Number(d.totalAmount) - Number(d.paidAmount));
                const pct = d.totalAmount > 0 ? Math.round((Number(d.paidAmount) / Number(d.totalAmount)) * 100) : 0;
                const isPayable = d.type === 'PAYABLE';

                return (
                  <div key={d.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                            isPayable ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isPayable ? 'UTANG SAYA' : 'PIUTANG'}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900">{d.personName}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            d.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {d.status === 'PAID' ? 'LUNAS' : d.status === 'PARTIALLY_PAID' ? 'DICICIL' : 'BELUM LUNAS'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Total: {formatCurrency(d.totalAmount)} • Terbayar: {formatCurrency(d.paidAmount)} •{' '}
                          <strong className="text-slate-800">Sisa: {formatCurrency(remaining)}</strong>
                          {d.dueDate ? ` • Tempo: ${d.dueDate}` : ''}
                        </p>
                        {d.notes && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{d.notes}"</p>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!isPayable && d.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleShareWhatsAppReminder(d)}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            title="Kirim Pengingat Sopan via WhatsApp"
                          >
                            <MessageCircle size={14} />
                            <span>Tagih WA</span>
                          </button>
                        )}
                        {d.status !== 'PAID' && (
                          <button
                            onClick={() => openPayDebtSheet(d)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                          >
                            {isPayable ? 'Bayar / Cicil' : 'Terima Bayaran'}
                          </button>
                        )}
                        <button
                          onClick={() => setDebts(debts.filter((item) => item.id !== d.id))}
                          className="p-2.5 text-slate-400 hover:text-rose-600 bg-white sm:bg-transparent rounded-xl border sm:border-0 border-slate-200 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 4: TARGET TABUNGAN (GOALS) & PORTOFOLIO ASET          */}
      {/* ========================================================= */}
      {activeTab === 'GOALS_ASSETS' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Buat Target Tabungan</h3>
                  <p className="text-xs text-slate-500">Dana darurat, beli rumah, liburan</p>
                </div>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Target</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beli MacBook / Dana Darurat"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Nominal (IDR)</label>
                  <CurrencyInput
                    required
                    placeholder="25.000.000"
                    value={goalTarget}
                    onChange={setGoalTarget}
                    showPrefix={false}
                    inputClassName="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Tanggal Tercapai</label>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer"
                >
                  Tambah Target Tabungan
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Progres Target Finansial ({goals.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map((g) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)) : 0;
                  return (
                    <div key={g.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-extrabold text-slate-900">{g.name}</h4>
                          <span className="text-xs font-black text-emerald-600">{pct}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Terkumpul <strong className="text-slate-800">{formatCurrency(g.currentAmount)}</strong> dari {formatCurrency(g.targetAmount)}
                        </p>
                        {g.deadline && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Target: {g.deadline}</span>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => openContributeGoalSheet(g)}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            + Tambah Tabungan
                          </button>
                          <button
                            onClick={() => setGoals(goals.filter((item) => item.id !== g.id))}
                            className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Investment Assets Portfolio Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Tambah Aset Investasi</h3>
                  <p className="text-xs text-slate-500">Emas, Saham, Reksadana, Kripto, Properti</p>
                </div>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Instrumen Aset</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Emas Antam 10g / BBCA"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kelas Aset</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="GOLD">Emas / Logam Mulia</option>
                    <option value="STOCK">Saham</option>
                    <option value="MUTUAL_FUND">Reksadana</option>
                    <option value="CRYPTO">Kripto</option>
                    <option value="PROPERTY">Properti</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Modal Beli (IDR)</label>
                    <CurrencyInput
                      required
                      placeholder="10.000.000"
                      value={assetBuyPrice}
                      onChange={setAssetBuyPrice}
                      showPrefix={false}
                      inputClassName="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nilai Sekarang</label>
                    <CurrencyInput
                      placeholder="11.500.000"
                      value={assetCurrentValue}
                      onChange={setAssetCurrentValue}
                      showPrefix={false}
                      inputClassName="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 text-xs cursor-pointer"
                >
                  Simpan Portofolio Aset
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Portofolio Aset & Return Investasi</h3>
                  <p className="text-xs text-slate-500">Total Nilai Pasar: {formatCurrency(totalAssetsValue)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {assets.map((a) => {
                  const pnl = Number(a.currentValue) - Number(a.buyPrice);
                  const pnlPct = Number(a.buyPrice) > 0 ? ((pnl / Number(a.buyPrice)) * 100).toFixed(1) : '0.0';
                  const isProfit = pnl >= 0;

                  return (
                    <div key={a.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 rounded-md uppercase">
                            {a.category}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900">{a.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Modal Beli: {formatCurrency(a.buyPrice)} • Nilai Saat Ini:{' '}
                          <strong className="text-slate-900">{formatCurrency(a.currentValue)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${
                          isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isProfit ? '+' : ''}{formatCurrency(pnl)} ({isProfit ? '+' : ''}{pnlPct}%)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openUpdateAssetSheet(a)}
                            className="p-2.5 text-slate-500 hover:text-indigo-600 bg-white sm:bg-transparent rounded-xl border sm:border-0 border-slate-200 cursor-pointer"
                            title="Update Nilai Pasar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setAssets(assets.filter((item) => item.id !== a.id))}
                            className="p-2.5 text-slate-500 hover:text-rose-600 bg-white sm:bg-transparent rounded-xl border sm:border-0 border-slate-200 cursor-pointer"
                            title="Hapus Aset"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE-FRIENDLY BOTTOM SHEET FOR QUICK ACTIONS            */}
      {/* (Replaces browser window.prompt & window.confirm)         */}
      {/* ========================================================= */}
      {actionSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="p-5 sm:p-6 pb-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {actionSheet.mode === 'PAY_DEBT' && (actionSheet.target.type === 'PAYABLE' ? 'Bayar / Cicil Utang' : 'Terima Pelunasan Piutang')}
                {actionSheet.mode === 'CONTRIBUTE_GOAL' && 'Tambah Tabungan Target'}
                {actionSheet.mode === 'UPDATE_ASSET' && 'Perbarui Nilai Pasar Aset'}
                {actionSheet.mode === 'DELETE_TX' && 'Hapus Transaksi?'}
              </h3>
              <button
                onClick={() => setActionSheet(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {actionSheet.mode === 'DELETE_TX' ? (
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Anda yakin ingin menghapus transaksi <strong className="text-slate-900">"{actionSheet.target.description}"</strong> senilai{' '}
                  <strong className="text-slate-900">{formatCurrency(actionSheet.target.amount)}</strong>? Saldo dompet terkait akan dikembalikan secara otomatis.
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActionSheet(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteTransaction(actionSheet.target)}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/25 cursor-pointer"
                  >
                    Ya, Hapus & Rollback
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActionSheetSubmit} className="p-5 sm:p-6 space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <span className="font-extrabold text-slate-800 block">
                    {actionSheet.target.personName || actionSheet.target.name}
                  </span>
                  {actionSheet.mode === 'PAY_DEBT' && (
                    <span className="text-slate-500 block">
                      Sisa tagihan: <strong>{formatCurrency(Number(actionSheet.target.totalAmount) - Number(actionSheet.target.paidAmount))}</strong>
                    </span>
                  )}
                  {actionSheet.mode === 'CONTRIBUTE_GOAL' && (
                    <span className="text-slate-500 block">
                      Kekurangan target: <strong>{formatCurrency(Math.max(0, Number(actionSheet.target.targetAmount) - Number(actionSheet.target.currentAmount)))}</strong>
                    </span>
                  )}
                  {actionSheet.mode === 'UPDATE_ASSET' && (
                    <span className="text-slate-500 block">
                      Modal beli: <strong>{formatCurrency(actionSheet.target.buyPrice)}</strong>
                    </span>
                  )}
                </div>

                {(actionSheet.mode === 'PAY_DEBT' || actionSheet.mode === 'CONTRIBUTE_GOAL') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                      {actionSheet.mode === 'CONTRIBUTE_GOAL' ? 'Ambil Alokasi Dari Dompet' : 'Gunakan Dompet'}
                    </label>
                    <select
                      value={debtPayWalletId}
                      onChange={(e) => setDebtPayWalletId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (Rp {Number(w.balance).toLocaleString('id-ID')})
                        </option>
                      ))}
                      {actionSheet.mode === 'CONTRIBUTE_GOAL' && (
                        <option value="NONE">Catat Progres Saja (Tanpa Potong Saldo Dompet)</option>
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nominal (IDR)</label>
                  <CurrencyInput
                    required
                    value={actionInputAmount}
                    onChange={setActionInputAmount}
                    inputClassName="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Quick Amount Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[100000, 250000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setActionInputAmount(String(preset))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[11px] font-bold cursor-pointer"
                      >
                        Rp {(preset / 1000).toLocaleString('id-ID')}rb
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 text-sm cursor-pointer"
                >
                  Simpan & Konfirmasi
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FIXED MOBILE BOTTOM NAVIGATION BAR (Thumb-Friendly UX)    */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1.5 pt-1.5 pb-safe shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-6 items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'TRANSACTIONS' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <WalletIcon size={19} />
            <span className="text-[10px] mt-0.5">Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('BUDGETS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'BUDGETS' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <PieChart size={19} />
            <span className="text-[10px] mt-0.5">Anggaran</span>
          </button>

          {/* Center Floating Quick-Record Button */}
          <div className="flex justify-center -mt-5">
            <button
              onClick={() => { setEditingTx(null); setIsTxModalOpen(true); }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-white active:scale-95 transition-transform cursor-pointer"
              title="Catat Transaksi Cepat"
            >
              <Plus size={22} className="stroke-[2.8]" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('DEBTS')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'DEBTS' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <HandCoins size={19} />
            <span className="text-[10px] mt-0.5">Utang</span>
            {unpaidDebtCount > 0 && (
              <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {unpaidDebtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('GOALS_ASSETS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'GOALS_ASSETS' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <Target size={19} />
            <span className="text-[10px] mt-0.5">Aset</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            title="Profil & Keamanan Akun"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-[9px] font-extrabold flex items-center justify-center">
              {user?.initials || <UserIcon size={12} />}
            </div>
            <span className="text-[10px] mt-0.5">Profil</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        wallets={wallets}
        onSaveTransaction={handleSaveTransaction}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => { setIsTxModalOpen(false); setEditingTx(null); }}
        wallets={wallets}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        customCategories={customCategories}
        onAddCategory={handleAddCustomCategory}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onTransfer={handleTransfer}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }}
        initialData={editingWallet}
        onSave={handleSaveWallet}
        onDelete={handleDeleteWallet}
      />
    </div>
  );
}
