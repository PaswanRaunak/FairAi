/**
 * FairLens AI — Landing Page
 * Hero section with animated gradient, CTAs, and feature showcase.
 */

import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineDocumentReport,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlinePlay,
  HiOutlineAdjustments,
} from 'react-icons/hi';
import { useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const features = [
  {
    icon: HiOutlineShieldCheck,
    title: 'Bias Detection',
    description: 'Calculate Demographic Parity, Equal Opportunity, Disparate Impact, and more.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    icon: HiOutlineSparkles,
    title: 'AI Explanations',
    description: 'Google Gemini translates complex metrics into plain-English summaries.',
    color: 'from-accent-500 to-accent-600',
  },
  {
    icon: HiOutlineChartBar,
    title: 'SHAP Explainability',
    description: 'Visualize feature importance and understand model decision reasoning.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: HiOutlineAdjustments,
    title: 'Simulation Lab',
    description: 'Interactive threshold sliders with real-time before/after comparison.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: HiOutlineLightBulb,
    title: 'Mitigation Advisor',
    description: 'AI-powered recommendations for rebalancing, tuning, and governance.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: HiOutlineDocumentReport,
    title: 'Audit Reports',
    description: 'Export compliance-ready PDF reports with Gemini-generated summaries.',
    color: 'from-violet-500 to-purple-500',
  },
];

const stats = [
  { value: '5+', label: 'Fairness Metrics' },
  { value: '3', label: 'Demo Datasets' },
  { value: 'AI', label: 'Powered by Gemini' },
  { value: 'PDF', label: 'Export Reports' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { guestLogin, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Guest login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 gradient-bg-animated opacity-50" />
      <div className="fixed inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
              <HiOutlineSparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">FairLens AI</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary text-sm"
          >
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 bg-primary-500/10 px-4 py-2 rounded-full border border-primary-500/20 mb-8">
                <HiOutlineSparkles className="w-4 h-4" />
                Powered by Google Gemini AI
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <span className="text-white">Audit AI Decisions</span>
              <br />
              <span className="gradient-text">for Fairness</span>
            </motion.h1>

            <motion.p
              className="text-lg lg:text-xl text-surface-200/70 max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Detect bias in automated decisions, get plain-English explanations from Gemini AI,
              and generate compliance-ready audit reports — all in one enterprise platform.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="btn-primary text-lg px-8 py-4 flex items-center gap-3 group"
                id="guest-login-btn"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <HiOutlinePlay className="w-5 h-5" />
                )}
                Continue as Guest
                <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-lg px-8 py-4"
                id="sign-in-btn"
              >
                Sign In
              </button>
            </motion.div>

            <motion.p
              className="text-sm text-surface-200/40 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              No signup required • Instant demo access • 3 sample datasets included
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-6 text-center rounded-2xl">
                <p className="text-3xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-surface-200/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Everything you need for fair AI
            </h2>
            <p className="text-surface-200/60 max-w-2xl mx-auto">
              Comprehensive bias detection, AI-powered explanations, and actionable insights — all in one platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="glass-card-hover p-8 rounded-2xl group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-200/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-surface-700/30 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HiOutlineSparkles className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-surface-200/40">FairLens AI — Ensuring Fairness in AI Decisions</span>
            </div>
            <p className="text-xs text-surface-200/30">
              Built for the Hackathon • Powered by Google Gemini & Vertex AI
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
