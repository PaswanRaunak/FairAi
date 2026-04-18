/**
 * FairLens AI — Glass Card Component
 * Glassmorphism card with hover effects.
 */

import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <motion.div
      className={`glass-card ${hover ? 'glass-card-hover cursor-pointer' : ''} p-6 ${className}`}
      whileHover={hover ? { scale: 1.01 } : {}}
      whileTap={hover && onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}
