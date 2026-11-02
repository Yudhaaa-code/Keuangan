import React, { useState } from 'react';
import { Wallet, ShieldCheck, Bell, User as UserIcon, Lock, Moon, Sun } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({
  hideBalance,
  onToggleHideBalance,
  darkMode,
  onToggleDarkMode,
  user,
  onOpenAuth,
  onLockScreen,
  alerts = [],
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('keuangan_read_alerts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleMarkAsRead = (id) => {
    setReadAlertIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('keuangan_read_alerts_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleMarkAllAsRead = (ids = []) => {
    setReadAlertIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      localStorage.setItem('keuangan_read_alerts_v1', JSON.stringify(next));
      return next;
    });
  };

  const unreadAlertCount = alerts.filter((a) => !readAlertIds.includes(a.id)).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wallet size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Keuangan<span className="text-indigo-600">.app</span>
            </span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Smart Daily Sync</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Dark Mode Toggle Button */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap (Malam)'}
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
          )}

          {/* Privacy Toggle Button */}
          <button
            onClick={onToggleHideBalance}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hideBalance 
                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-700'
            }`}
            title="Sembunyikan/Tampilkan nominal saldo di layar"
          >
            <ShieldCheck size={16} className={hideBalance ? 'text-amber-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">{hideBalance ? 'Privasi Aktif' : 'Mode Privasi'}</span>
          </button>

          {/* Quick PIN Lock Button */}
          {user && onLockScreen && (
            <button
              onClick={onLockScreen}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Kunci Layar dengan PIN 6-Digit"
            >
              <Lock size={17} />
            </button>
          )}

          {/* Notification Bell Dropdown Anchor */}
          {user && (
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl transition-colors relative cursor-pointer ${
                  isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Notifikasi & Tagihan Jatuh Tempo"
              >
                <Bell size={18} />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                alerts={alerts}
                readIds={readAlertIds}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </div>
          )}

          {/* User Profile / Login Avatar (Tampil di Desktop md+, karena di Mobile sudah ada di Bottom Bar sebelah Aset) */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
            {user ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                title="Lihat Profil, PIN, & Backup Data"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.initials || 'YD'}
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 hidden sm:inline">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <UserIcon size={14} />
                <span>Masuk</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
