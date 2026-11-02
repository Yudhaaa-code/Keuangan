import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/AuthModal';
import PinLockModal from './components/PinLockModal';
import { getSessionUser, saveSessionUser, getRegisteredAccounts } from './utils/auth';

export default function App() {
  const [hideBalance, setHideBalance] = useState(() => {
    return localStorage.getItem('keuangan_hide_balance') === 'true';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('keuangan_dark_mode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('keuangan_dark_mode', String(darkMode));
  }, [darkMode]);

  const [user, setUser] = useState(() => {
    const existingSession = getSessionUser();
    if (existingSession) return existingSession;

    const hasExplicitlyLoggedOut = localStorage.getItem('keuangan_logged_out') === 'true';
    if (hasExplicitlyLoggedOut) return null;

    const initialUser = {
      id: 'default-user-id',
      fullName: 'YuDhae',
      email: 'yudhae@keuangan.app',
      initials: 'YD',
      biometricEnabled: true,
      lastLogin: 'Sesi Aktif',
    };
    saveSessionUser(initialUser);
    return initialUser;
  });

  const [isPinLocked, setIsPinLocked] = useState(() => {
    return localStorage.getItem('keuangan_pin_locked') === 'true';
  });

  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getRegisteredAccounts();
  }, []);

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      localStorage.setItem('keuangan_hide_balance', String(next));
      return next;
    });
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLockScreen = () => {
    localStorage.setItem('keuangan_pin_locked', 'true');
    setIsPinLocked(true);
  };

  const handleUnlockScreen = () => {
    localStorage.removeItem('keuangan_pin_locked');
    setIsPinLocked(false);
  };

  const handleLogin = (newUser) => {
    localStorage.removeItem('keuangan_logged_out');
    localStorage.removeItem('keuangan_pin_locked');
    saveSessionUser(newUser);
    setIsPinLocked(false);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.setItem('keuangan_logged_out', 'true');
    localStorage.removeItem('keuangan_pin_locked');
    saveSessionUser(null);
    setIsPinLocked(false);
    setUser(null);
    setAlerts([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-0">
      <Navbar 
        hideBalance={hideBalance} 
        onToggleHideBalance={toggleHideBalance} 
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLockScreen={handleLockScreen}
        alerts={user ? alerts : []}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {user ? (
          <Dashboard
            key={`${user.email || user.id}-${vaultRefreshKey}`}
            user={user}
            hideBalance={hideBalance}
            setHideBalance={toggleHideBalance}
            onAlertsChange={setAlerts}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        ) : (
          <AuthModal
            isOpen={true}
            isFullPage={true}
            user={null}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Keuangan.app • Platform Manajemen Finansial Harian, Multi-Wallet, Anggaran & Portofolio Aset
      </footer>

      {user && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onLockScreen={handleLockScreen}
          onVaultRestored={() => setVaultRefreshKey((k) => k + 1)}
        />
      )}

      <PinLockModal
        isOpen={isPinLocked && Boolean(user)}
        user={user}
        onUnlock={handleUnlockScreen}
        onLogout={handleLogout}
      />
    </div>
  );
}
