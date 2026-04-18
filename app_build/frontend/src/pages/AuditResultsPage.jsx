/**
 * FairLens AI — Audit Results Page
 * Displays bias metrics, AI explanations, and mitigation advice.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { geminiAPI } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import AnimatedCounter from '../components/common/AnimatedCounter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineSparkles,
  HiOutlineChartBar, HiOutlineLightBulb, HiOutlineCheckCircle,
} from 'react-icons/hi';

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'severity-critical', label: 'Critical Bias' },
  high: { color: 'text-orange-400', bg: 'severity-high', label: 'High Bias' },
  medium: { color: 'text-amber-400', bg: 'severity-medium', label: 'Medium Bias' },
  low: { color: 'text-emerald-400', bg: 'severity-low', label: 'Low Bias' },
};

export default function AuditResultsPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [model, setModel] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [explanation, setExplanation] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [loadingMitigate, setLoadingMitigate] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    const savedAnalysis = sessionStorage.getItem('fairlens_analysis');
    const savedModel = sessionStorage.getItem('fairlens_model');
    const savedName = sessionStorage.getItem('fairlens_dataset_name');

    if (savedAnalysis) setAnalysis(JSON.parse(savedAnalysis));
    if (savedModel) setModel(JSON.parse(savedModel));
    if (savedName) setDatasetName(savedName);
  }, []);

  const handleExplain = async () => {
    if (!model) return;
    setLoadingExplain(true);
    try {
      const { data } = await geminiAPI.explain({ modelId: model.modelId, datasetName });
      setExplanation(data.explanation);
    } catch (err) {
      setExplanation('Failed to generate explanation. Please try again.');
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleMitigate = async () => {
    if (!model) return;
    setLoadingMitigate(true);
    try {
      const { data } = await geminiAPI.mitigate({ modelId: model.modelId, datasetName });
      setMitigation(data.recommendations);
    } catch (err) {
      setMitigation('Failed to generate recommendations. Please try again.');
    } finally {
      setLoadingMitigate(false);
    }
  };

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <HiOutlineChartBar className="w-16 h-16 mx-auto text-surface-200/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Audit Results Yet</h2>
        <p className="text-surface-200/50 mb-6">Upload a dataset and run bias analysis first.</p>
        <button onClick={() => navigate('/dashboard/upload')} className="btn-primary">
          Go to Upload
        </button>
      </div>
    );
  }

  const overallSeverity = severityConfig[analysis.overallBiasLevel] || severityConfig.low;

  // Prepare chart data
  const groupChartData = [];
  Object.entries(analysis.metrics || {}).forEach(([attr, data]) => {
    (data.groupBreakdown || []).forEach(group => {
      groupChartData.push({
        name: `${group.group}`,
        actual: +(group.actualPositiveRate * 100).toFixed(1),
        predicted: +(group.predictedPositiveRate * 100).toFixed(1),
        attribute: attr,
      });
    });
  });

  // Radar data
  const radarData = Object.entries(analysis.metrics || {}).map(([attr, data]) => ({
    attribute: attr,
    'Demographic Parity': +((1 - data.demographicParity?.value) * 100).toFixed(1),
    'Equal Opportunity': +((1 - data.equalOpportunity?.value) * 100).toFixed(1),
    'Disparate Impact': +(data.disparateImpact?.value * 100).toFixed(1),
  }));

  const tabs = [
    { key: 'metrics', label: 'Bias Metrics', icon: HiOutlineChartBar },
    { key: 'explain', label: 'AI Explanation', icon: HiOutlineSparkles },
    { key: 'mitigate', label: 'Mitigation', icon: HiOutlineLightBulb },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Audit Results</h1>
        <p className="text-surface-200/60">Bias analysis for "{datasetName}"</p>
      </motion.div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard hover={false} className="text-center">
          <p className="text-xs text-surface-200/40 mb-1">Bias Level</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${overallSeverity.bg}`}>
            {analysis.overallBiasLevel === 'low' ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineExclamation className="w-4 h-4" />}
            {overallSeverity.label}
          </div>
        </GlassCard>

        <GlassCard hover={false} className="text-center">
          <p className="text-xs text-surface-200/40 mb-1">Model Accuracy</p>
          <p className="text-2xl font-bold text-white">
            <AnimatedCounter value={(model?.testAccuracy || 0) * 100} decimals={1} suffix="%" />
          </p>
        </GlassCard>

        <GlassCard hover={false} className="text-center">
          <p className="text-xs text-surface-200/40 mb-1">Attributes Audited</p>
          <p className="text-2xl font-bold text-primary-400">
            <AnimatedCounter value={Object.keys(analysis.metrics || {}).length} />
          </p>
        </GlassCard>

        <GlassCard hover={false} className="text-center">
          <p className="text-xs text-surface-200/40 mb-1">Total Samples</p>
          <p className="text-2xl font-bold text-accent-400">
            <AnimatedCounter value={analysis.overallStats?.totalSamples || 0} />
          </p>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-700/50 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all
              ${activeTab === tab.key
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-surface-200/50 hover:text-surface-200'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Metrics per attribute */}
          {Object.entries(analysis.metrics || {}).map(([attr, data]) => {
            const sev = severityConfig[data.severity] || severityConfig.low;
            return (
              <GlassCard key={attr} hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <HiOutlineShieldCheck className={`w-6 h-6 ${sev.color}`} />
                    <h3 className="text-lg font-semibold text-white capitalize">{attr}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sev.bg}`}>{sev.label}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-surface-800/50 p-4 rounded-xl">
                    <p className="text-xs text-surface-200/40 mb-1">Demographic Parity</p>
                    <p className="text-xl font-bold text-white">{data.demographicParity?.value?.toFixed(4)}</p>
                    <p className={`text-xs mt-1 ${data.demographicParity?.value > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {data.demographicParity?.value > 0.1 ? '⚠ Biased' : '✓ Fair'}
                    </p>
                  </div>
                  <div className="bg-surface-800/50 p-4 rounded-xl">
                    <p className="text-xs text-surface-200/40 mb-1">Equal Opportunity</p>
                    <p className="text-xl font-bold text-white">{data.equalOpportunity?.value?.toFixed(4)}</p>
                    <p className={`text-xs mt-1 ${data.equalOpportunity?.value > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {data.equalOpportunity?.value > 0.1 ? '⚠ Biased' : '✓ Fair'}
                    </p>
                  </div>
                  <div className="bg-surface-800/50 p-4 rounded-xl">
                    <p className="text-xs text-surface-200/40 mb-1">Disparate Impact</p>
                    <p className="text-xl font-bold text-white">{data.disparateImpact?.value?.toFixed(4)}</p>
                    <p className={`text-xs mt-1 ${data.disparateImpact?.value < 0.8 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {data.disparateImpact?.value < 0.8 ? '⚠ Fails 80% rule' : '✓ Passes'}
                    </p>
                  </div>
                  <div className="bg-surface-800/50 p-4 rounded-xl">
                    <p className="text-xs text-surface-200/40 mb-1">Statistical Parity</p>
                    <p className="text-xl font-bold text-white">{data.statisticalParity?.value?.toFixed(4)}</p>
                    <p className={`text-xs mt-1 ${data.statisticalParity?.value > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {data.statisticalParity?.value > 0.1 ? '⚠ Biased' : '✓ Fair'}
                    </p>
                  </div>
                </div>

                {/* Group comparison chart */}
                <h4 className="text-sm font-medium text-surface-200/60 mb-3">Group Outcome Rates</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.groupBreakdown?.map(g => ({
                      group: g.group,
                      'Actual Rate': +(g.actualPositiveRate * 100).toFixed(1),
                      'Predicted Rate': +(g.predictedPositiveRate * 100).toFixed(1),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="group" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#E2E8F0' }}
                        formatter={(value) => `${value}%`}
                      />
                      <Legend />
                      <Bar dataKey="Actual Rate" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Predicted Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            );
          })}

          {/* Fairness Radar */}
          {radarData.length > 0 && (
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-white mb-4">Fairness Radar</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="attribute" stroke="#94A3B8" fontSize={12} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#475569" fontSize={10} />
                    <Radar name="Demographic Parity" dataKey="Demographic Parity" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} />
                    <Radar name="Equal Opportunity" dataKey="Equal Opportunity" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                    <Radar name="Disparate Impact" dataKey="Disparate Impact" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#E2E8F0' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}

      {activeTab === 'explain' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {!explanation ? (
            <GlassCard hover={false} className="text-center py-12">
              <HiOutlineSparkles className="w-12 h-12 mx-auto text-primary-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Bias Explanation</h3>
              <p className="text-sm text-surface-200/50 mb-6 max-w-md mx-auto">
                Let Google Gemini analyze the bias metrics and explain the findings in plain English.
              </p>
              <button onClick={handleExplain} disabled={loadingExplain} className="btn-primary flex items-center gap-2 mx-auto">
                {loadingExplain ? <LoadingSpinner size="sm" /> : <HiOutlineSparkles className="w-5 h-5" />}
                Generate Explanation
              </button>
            </GlassCard>
          ) : (
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineSparkles className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">Gemini AI Explanation</h3>
              </div>
              <div className="markdown-content prose prose-invert max-w-none">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}

      {activeTab === 'mitigate' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {!mitigation ? (
            <GlassCard hover={false} className="text-center py-12">
              <HiOutlineLightBulb className="w-12 h-12 mx-auto text-accent-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Bias Mitigation Advisor</h3>
              <p className="text-sm text-surface-200/50 mb-6 max-w-md mx-auto">
                Get AI-powered recommendations to reduce bias and improve fairness.
              </p>
              <button onClick={handleMitigate} disabled={loadingMitigate} className="btn-accent flex items-center gap-2 mx-auto">
                {loadingMitigate ? <LoadingSpinner size="sm" /> : <HiOutlineLightBulb className="w-5 h-5" />}
                Get Recommendations
              </button>
            </GlassCard>
          ) : (
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineLightBulb className="w-5 h-5 text-accent-400" />
                <h3 className="font-semibold text-white">Mitigation Recommendations</h3>
              </div>
              <div className="markdown-content prose prose-invert max-w-none">
                <ReactMarkdown>{mitigation}</ReactMarkdown>
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}
    </div>
  );
}
