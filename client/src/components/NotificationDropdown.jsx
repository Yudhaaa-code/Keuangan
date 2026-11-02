import React, { useState, useMemo } from 'react';
import {
  CheckCheck,
  Calendar,
  PieChart,
  Sparkles,
  X,
  Repeat,
  BellRing,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function NotificationDropdown({
  isOpen,
  onClose,
  alerts = [],
  readIds = [],
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'BUDGET_ALERT' | 'DUE_DATE'

  const notifications = useMemo(() => {
    if (alerts && alerts.length > 0) {
      return alerts.map((a) => ({
        ...a,
        isRead: readIds.includes(a.id),
      }));
    }
    return [
      {
        id: 'default-1',
        title: 'Semua Anggaran & Tagihan Terkendali',
        message: 'Belum ada anggaran yang melewati batas 80% atau utang jatuh tempo.',
        type: 'GOAL',
        time: 'Hari ini',
        isRead: readIds.includes('default-1'),
      },
    ];
  }, [alerts, readIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'UNREAD') return !n.isRead;
      if (activeFilter === 'BUDGET_ALERT') return n.type === 'BUDGET_ALERT';
      if (activeFilter === 'DUE_DATE') return n.type === 'DUE_DATE';
      return true;
    });
  }, [notifications, activeFilter]);

  if (!isOpen) return null;

  const getMeta = (type, title = '') => {
    const isOver = title.toLowerCase().includes('terlampaui');
    if (type === 'DUE_DATE') {
      return {
        icon: Calendar,
        badge: 'Utang / Piutang',
        iconBox: 'bg-rose-50 text-rose-600 border-rose-200/80',
        badgeStyle: 'bg-rose-100 text-rose-700',
        accentBorder: 'border-l-rose-500',
      };
    }
    if (type === 'BUDGET_ALERT') {
      return {
        icon: PieChart,
        badge: isOver ? 'Overbudget' : 'Peringatan Anggaran',
        iconBox: isOver
          ? 'bg-rose-50 text-rose-600 border-rose-200/80'
          : 'bg-amber-50 text-amber-600 border-amber-200/80',
        badgeStyle: isOver ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
        accentBorder: isOver ? 'border-l-rose-500' : 'border-l-amber-500',
      };
    }
    if (type === 'RECURRING') {
      return {
        icon: Repeat,
        badge: 'Transaksi Rutin',
        iconBox: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
        badgeStyle: 'bg-indigo-100 text-indigo-700',
        accentBorder: 'border-l-indigo-500',
      };
    }
    return {
      icon: Sparkles,
      badge: 'Info Finansial',
      iconBox: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badgeStyle: 'bg-emerald-100 text-emerald-700',
      accentBorder: 'border-l-emerald-500',
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
        onClick={onClose}
      />

      {/* Dropdown Container */}
      <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 z-50 sm:w-[410px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22)] border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:px-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/25 flex-shrink-0">
                <BellRing size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    Pusat Notifikasi
                  </h4>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full whitespace-nowrap flex-shrink-0 shadow-xs">
                      {unreadCount} Baru
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap flex-shrink-0">
                      Terbaca
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Pantauan anggaran, jatuh tempo, & tagihan rutin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => onMarkAllAsRead && onMarkAllAsRead(notifications.map((n) => n.id))}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck size={13} />
                  <span>Baca Semua</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: `Semua (${notifications.length})` },
              { id: 'UNREAD', label: `Belum Dibaca (${unreadCount})` },
              { id: 'BUDGET_ALERT', label: 'Anggaran' },
              { id: 'DUE_DATE', label: 'Utang/Piutang' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[60vh] sm:max-h-[360px] overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-xs font-extrabold text-slate-800">Tidak ada notifikasi pada kategori ini</p>
              <p className="text-[11px] text-slate-400">Semua pemberitahuan terkait sudah Anda periksa.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const meta = getMeta(notif.type, notif.title);
              const IconComponent = meta.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    !notif.isRead
                      ? `bg-white border-slate-200/90 border-l-4 ${meta.accentBorder} shadow-xs hover:shadow-md`
                      : 'bg-white/70 border-slate-200/50 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0 ${meta.iconBox}`}>
                    <IconComponent size={18} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${meta.badgeStyle}`}>
                        {meta.badge}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {notif.time}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100 flex-shrink-0" title="Belum dibaca" />
                        )}
                      </div>
                    </div>

                    <h5 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {notif.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold">Ketuk kartu untuk menandai sudah dibaca</span>
          <span className="font-extrabold text-indigo-600">Smart Alert v2</span>
        </div>
      </div>
    </>
  );
}
