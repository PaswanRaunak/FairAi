/**
 * FairLens AI — Navbar Component
 */

import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineLogout, HiOutlineUser, HiOutlineMenu } from 'react-icons/hi';

export default function Navbar({ onToggleSidebar }) {
  const { user, isGuest, logout } = useAuth();

  return (
    <nav className="fixed top-0 right-0 left-0 md:left-64 z-40 h-16 glass-card border-b border-surface-700/50 flex items-center justify-between px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 hover:bg-surface-800 rounded-lg transition-colors"
      >
        <HiOutlineMenu className="w-6 h-6" />
      </button>

      {/* Breadcrumb area */}
      <div className="hidden md:block">
        <p className="text-sm text-surface-200/60">Welcome back</p>
      </div>

      {/* User info + Logout */}
      <div className="flex items-center gap-4">
        {isGuest && (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-medium">
            Guest Mode
          </span>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <HiOutlineUser className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-surface-200">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-surface-200/50">
              {user?.email || (isGuest ? 'Demo Access' : '')}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-surface-200/60"
          title="Logout"
        >
          <HiOutlineLogout className="w-5 h-5" />
        </motion.button>
      </div>
    </nav>
  );
}
