/**
 * FairLens AI — Sidebar Navigation
 */

import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineCloudUpload,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineAdjustments,
  HiOutlineDocumentReport,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';

const navItems = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Overview' },
  { path: '/dashboard/upload', icon: HiOutlineCloudUpload, label: 'Upload Data' },
  { path: '/dashboard/audit', icon: HiOutlineChartBar, label: 'Audit Results' },
  { path: '/dashboard/explain', icon: HiOutlineLightBulb, label: 'Explainability' },
  { path: '/dashboard/simulate', icon: HiOutlineAdjustments, label: 'Simulation Lab' },
  { path: '/dashboard/report', icon: HiOutlineDocumentReport, label: 'Reports' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-surface-950 border-r border-surface-700/50
          transform transition-transform duration-300 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">FairLens</h1>
              <p className="text-[10px] text-surface-200/40 -mt-1 tracking-widest uppercase">AI</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-surface-800 rounded-lg">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20 shadow-glow-primary'
                  : 'text-surface-200/60 hover:text-surface-200 hover:bg-surface-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-700/50">
          <div className="glass-card p-4 rounded-xl text-center">
            <p className="text-xs text-surface-200/40 mb-1">Powered by</p>
            <p className="text-sm font-semibold gradient-text">Google Gemini AI</p>
          </div>
        </div>
      </aside>
    </>
  );
}
