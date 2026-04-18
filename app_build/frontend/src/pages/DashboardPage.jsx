/**
 * FairLens AI — Dashboard Overview Page
 * Shows demo dataset selection and quick actions.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { datasetAPI, biasAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineBriefcase,
  HiOutlineCreditCard,
  HiOutlineAcademicCap,
  HiOutlineCloudUpload,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineSparkles,
} from 'react-icons/hi';

const demoDatasets = [
  {
    key: 'hiring',
    name: 'Hiring Decisions',
    description: 'Gender & racial bias in hiring outcomes (1000 candidates)',
    icon: HiOutlineBriefcase,
    color: 'from-blue-500 to-indigo-500',
    tags: ['gender', 'race'],
  },
  {
    key: 'loan',
    name: 'Loan Approvals',
    description: 'Income & racial bias in loan decisions (1000 applicants)',
    icon: HiOutlineCreditCard,
    color: 'from-emerald-500 to-teal-500',
    tags: ['race', 'income'],
  },
  {
    key: 'college_admission',
    name: 'College Admissions',
    description: 'Caste & regional bias in admissions (1000 students)',
    icon: HiOutlineAcademicCap,
    color: 'from-amber-500 to-orange-500',
    tags: ['caste', 'region'],
  },
];

const quickActions = [
  { icon: HiOutlineCloudUpload, label: 'Upload Dataset', path: '/dashboard/upload', color: 'text-primary-400' },
  { icon: HiOutlineChartBar, label: 'View Audit', path: '/dashboard/audit', color: 'text-accent-400' },
  { icon: HiOutlineLightBulb, label: 'Explainability', path: '/dashboard/explain', color: 'text-amber-400' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [loadingDataset, setLoadingDataset] = useState(null);

  const handleLoadDemo = async (datasetKey) => {
    setLoadingDataset(datasetKey);
    try {
      const { data } = await datasetAPI.loadDemo(datasetKey);
      const info = demoDatasets.find(d => d.key === datasetKey);

      // Store audit context in sessionStorage
      sessionStorage.setItem('fairlens_dataset', JSON.stringify({
        datasetId: data.datasetId,
        name: data.name,
        preview: data.preview,
        sensitiveAttributes: data.sensitiveAttributes.map(a => a.name),
        suggestedTargets: data.suggestedTargets,
        info: data.info,
      }));

      navigate('/dashboard/upload', { state: { datasetLoaded: true } });
    } catch (error) {
      console.error('Failed to load demo dataset:', error);
    } finally {
      setLoadingDataset(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, {user?.displayName || 'there'} 👋
        </h1>
        <p className="text-surface-200/60">
          {isGuest
            ? "You're in demo mode. Select a sample dataset below to start auditing for bias."
            : 'Upload a dataset or select a demo to begin your fairness audit.'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {quickActions.map((action, i) => (
          <GlassCard
            key={i}
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate(action.path)}
          >
            <action.icon className={`w-8 h-8 ${action.color}`} />
            <span className="font-medium text-surface-200">{action.label}</span>
          </GlassCard>
        ))}
      </motion.div>

      {/* Demo Datasets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <HiOutlineSparkles className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-semibold text-white">Demo Datasets</h2>
          <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
            Pre-loaded with bias
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {demoDatasets.map((dataset, i) => (
            <motion.div
              key={dataset.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <GlassCard
                className="h-full flex flex-col"
                onClick={() => handleLoadDemo(dataset.key)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dataset.color} flex items-center justify-center mb-4`}>
                  <dataset.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{dataset.name}</h3>
                <p className="text-sm text-surface-200/60 mb-4 flex-grow">{dataset.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {dataset.tags.map(tag => (
                    <span key={tag} className="text-xs bg-surface-800 text-surface-200/60 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  disabled={loadingDataset === dataset.key}
                  className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {loadingDataset === dataset.key ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>Load & Analyze</>
                  )}
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
