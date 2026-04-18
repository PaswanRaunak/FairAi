/**
 * FairLens AI — Simulation Lab Page
 * Interactive threshold sliders with before/after fairness comparison.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { simulateAPI } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineAdjustments,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineBeaker,
} from 'react-icons/hi';

export default function SimulationPage() {
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedAttr, setSelectedAttr] = useState('');
  const [groups, setGroups] = useState([]);
  const [thresholds, setThresholds] = useState({});
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedModel = sessionStorage.getItem('fairlens_model');
    const savedAnalysis = sessionStorage.getItem('fairlens_analysis');
    if (savedModel) setModel(JSON.parse(savedModel));
    if (savedAnalysis) {
      const data = JSON.parse(savedAnalysis);
      setAnalysis(data);
      const attrs = Object.keys(data.metrics || {});
      if (attrs.length > 0) {
        setSelectedAttr(attrs[0]);
        const grps = data.metrics[attrs[0]]?.uniqueGroups || [];
        setGroups(grps);
        const defaultThresholds = {};
        grps.forEach(g => defaultThresholds[g] = 0.5);
        setThresholds(defaultThresholds);
      }
    }
  }, []);

  useEffect(() => {
    if (analysis && selectedAttr) {
      const grps = analysis.metrics[selectedAttr]?.uniqueGroups || [];
      setGroups(grps);
      const defaultThresholds = {};
      grps.forEach(g => defaultThresholds[g] = 0.5);
      setThresholds(defaultThresholds);
      setSimulationResult(null);
    }
  }, [selectedAttr, analysis]);

  const handleSimulate = async () => {
    if (!model || !selectedAttr) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await simulateAPI.threshold({
        modelId: model.modelId,
        sensitiveAttribute: selectedAttr,
        thresholds,
      });
      setSimulationResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultThresholds = {};
    groups.forEach(g => defaultThresholds[g] = 0.5);
    setThresholds(defaultThresholds);
    setSimulationResult(null);
  };

  if (!model || !analysis) {
    return (
      <div className="text-center py-20">
        <HiOutlineAdjustments className="w-16 h-16 mx-auto text-surface-200/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Analysis Available</h2>
        <p className="text-surface-200/50 mb-6">Run a bias analysis first to use the simulation lab.</p>
        <button onClick={() => navigate('/dashboard/upload')} className="btn-primary">Go to Upload</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <HiOutlineBeaker className="w-7 h-7 text-primary-400" />
          Fairness Simulation Lab
        </h1>
        <p className="text-surface-200/60">Adjust classification thresholds per group and see the impact on fairness in real time.</p>
      </motion.div>

      {/* Attribute Selector */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <label className="text-sm text-surface-200/60 mb-2 block">Sensitive Attribute</label>
            <select
              value={selectedAttr}
              onChange={(e) => setSelectedAttr(e.target.value)}
              className="px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:border-primary-500 outline-none min-w-[200px]"
            >
              {Object.keys(analysis.metrics || {}).map(attr => (
                <option key={attr} value={attr}>{attr}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
              <HiOutlineRefresh className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSimulate} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
              {loading ? <LoadingSpinner size="sm" /> : <HiOutlineAdjustments className="w-4 h-4" />}
              Run Simulation
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Threshold Sliders */}
      <GlassCard hover={false}>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineAdjustments className="w-5 h-5 text-amber-400" />
          Classification Thresholds
        </h3>
        <p className="text-xs text-surface-200/40 mb-6">
          Adjust the decision threshold for each group. Higher threshold = fewer positive predictions for that group.
        </p>

        <div className="space-y-6">
          {groups.map(group => (
            <div key={group} className="flex items-center gap-6">
              <div className="w-28 flex-shrink-0">
                <span className="text-sm font-medium text-surface-200">{group}</span>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={thresholds[group] || 0.5}
                  onChange={(e) => setThresholds(prev => ({ ...prev, [group]: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-glow-primary"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-surface-200/30">0.1</span>
                  <span className="text-[10px] text-surface-200/30">0.9</span>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-sm font-mono font-bold ${
                  thresholds[group] !== 0.5 ? 'text-primary-400' : 'text-surface-200/60'
                }`}>
                  {(thresholds[group] || 0.5).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
      )}

      {/* Simulation Results */}
      {simulationResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Before/After Metrics Comparison */}
          <GlassCard hover={false}>
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              Before / After Comparison
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Demographic Parity */}
              <div className="bg-surface-800/50 p-4 rounded-xl">
                <p className="text-xs text-surface-200/40 mb-2">Demographic Parity Diff</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-400">
                    {simulationResult.before.demographicParity.value.toFixed(4)}
                  </span>
                  <HiOutlineArrowRight className="w-4 h-4 text-surface-200/30" />
                  <span className="text-lg font-bold text-emerald-400">
                    {simulationResult.after.demographicParity.value.toFixed(4)}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  simulationResult.improvement.demographicParity > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {simulationResult.improvement.demographicParity > 0 ? '↓' : '↑'} {Math.abs(simulationResult.improvement.demographicParity).toFixed(4)} change
                </p>
              </div>

              {/* Disparate Impact */}
              <div className="bg-surface-800/50 p-4 rounded-xl">
                <p className="text-xs text-surface-200/40 mb-2">Disparate Impact Ratio</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${simulationResult.before.disparateImpact.value < 0.8 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {simulationResult.before.disparateImpact.value.toFixed(4)}
                  </span>
                  <HiOutlineArrowRight className="w-4 h-4 text-surface-200/30" />
                  <span className={`text-lg font-bold ${simulationResult.after.disparateImpact.value < 0.8 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {simulationResult.after.disparateImpact.value.toFixed(4)}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  simulationResult.improvement.disparateImpact > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {simulationResult.improvement.disparateImpact > 0 ? '↑' : '↓'} {Math.abs(simulationResult.improvement.disparateImpact).toFixed(4)} change
                </p>
              </div>

              {/* Positive Rate */}
              <div className="bg-surface-800/50 p-4 rounded-xl">
                <p className="text-xs text-surface-200/40 mb-2">Overall Positive Rate</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {(simulationResult.before.positiveRate * 100).toFixed(1)}%
                  </span>
                  <HiOutlineArrowRight className="w-4 h-4 text-surface-200/30" />
                  <span className="text-lg font-bold text-white">
                    {(simulationResult.after.positiveRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Group Comparison Chart */}
          <GlassCard hover={false}>
            <h3 className="font-semibold text-white mb-4">Group Outcome Rates: Before vs After</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationResult.groupComparison.map(g => ({
                  group: g.group,
                  'Before': +(g.beforeRate * 100).toFixed(1),
                  'After': +(g.afterRate * 100).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="group" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#E2E8F0' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Bar dataKey="Before" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.7} />
                  <Bar dataKey="After" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Group Details Table */}
          <GlassCard hover={false}>
            <h3 className="font-semibold text-white mb-4">Group Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700/50">
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Group</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Count</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Threshold</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Before Rate</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">After Rate</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.groupComparison.map(g => (
                    <tr key={g.group} className="border-b border-surface-700/20 hover:bg-surface-800/30">
                      <td className="py-2 px-3 text-white font-medium">{g.group}</td>
                      <td className="py-2 px-3 text-surface-200">{g.count}</td>
                      <td className="py-2 px-3 text-primary-400 font-mono">{g.threshold.toFixed(2)}</td>
                      <td className="py-2 px-3 text-surface-200">{(g.beforeRate * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-surface-200">{(g.afterRate * 100).toFixed(1)}%</td>
                      <td className={`py-2 px-3 font-medium ${g.change > 0 ? 'text-emerald-400' : g.change < 0 ? 'text-red-400' : 'text-surface-200/40'}`}>
                        {g.change > 0 ? '+' : ''}{(g.change * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
