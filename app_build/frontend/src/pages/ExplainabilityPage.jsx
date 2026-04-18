/**
 * FairLens AI — Explainability Page
 * SHAP feature importance visualization and decision reasoning.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { explainAPI } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineEye,
} from 'react-icons/hi';

export default function ExplainabilityPage() {
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSample, setSelectedSample] = useState(0);

  useEffect(() => {
    const savedModel = sessionStorage.getItem('fairlens_model');
    if (savedModel) {
      setModel(JSON.parse(savedModel));
    }
  }, []);

  const handleComputeShap = async () => {
    if (!model) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await explainAPI.shap({ modelId: model.modelId });
      setShapData(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'SHAP computation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!model) {
    return (
      <div className="text-center py-20">
        <HiOutlineLightBulb className="w-16 h-16 mx-auto text-surface-200/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Model Available</h2>
        <p className="text-surface-200/50 mb-6">Train a model first to see explainability insights.</p>
        <button onClick={() => navigate('/dashboard/upload')} className="btn-primary">Go to Upload</button>
      </div>
    );
  }

  // Color scale for SHAP bars
  const getColor = (value, index) => {
    const colors = ['#6366F1', '#818CF8', '#A5B4FC', '#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#FBBF24'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Explainable AI Dashboard</h1>
        <p className="text-surface-200/60">Understand how the model makes decisions using SHAP analysis.</p>
      </motion.div>

      {/* Model Info */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Trained Model</h3>
            <div className="flex items-center gap-4 text-sm text-surface-200/60">
              <span>Type: <span className="text-primary-400">{model.modelType?.replace('_', ' ')}</span></span>
              <span>Accuracy: <span className="text-accent-400">{(model.testAccuracy * 100).toFixed(1)}%</span></span>
              <span>Features: <span className="text-white">{model.featureNames?.length}</span></span>
            </div>
          </div>
          {!shapData && (
            <button onClick={handleComputeShap} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : <HiOutlineEye className="w-5 h-5" />}
              Compute SHAP Values
            </button>
          )}
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="xl" text="Computing SHAP values... This may take a moment." />
        </div>
      )}

      {shapData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Feature Importance Chart */}
          <GlassCard hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <HiOutlineChartBar className="w-6 h-6 text-primary-400" />
              <div>
                <h3 className="font-semibold text-white">Feature Importance</h3>
                <p className="text-xs text-surface-200/40">Mean absolute SHAP values — higher = more influential</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapData.featureImportance?.slice(0, 10).reverse()}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                  <YAxis type="category" dataKey="feature" stroke="#94A3B8" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#E2E8F0' }}
                    formatter={(value) => value.toFixed(4)}
                  />
                  <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                    {shapData.featureImportance?.slice(0, 10).reverse().map((entry, index) => (
                      <Cell key={index} fill={getColor(entry.importance, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Individual SHAP Values / Force Plot Approximation */}
          {shapData.individualShap && shapData.individualShap.length > 0 && (
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <HiOutlineLightBulb className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-white">Individual Decision Reasoning</h3>
                    <p className="text-xs text-surface-200/40">SHAP values for individual predictions</p>
                  </div>
                </div>
                <select
                  value={selectedSample}
                  onChange={(e) => setSelectedSample(Number(e.target.value))}
                  className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-white text-sm focus:border-primary-500 outline-none"
                >
                  {shapData.individualShap.map((s, i) => (
                    <option key={i} value={i}>Sample #{s.index}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const sample = shapData.individualShap[selectedSample];
                if (!sample) return null;

                const sampleData = Object.entries(sample.values)
                  .map(([feature, value]) => ({ feature, value: +value }))
                  .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                  .slice(0, 10);

                return (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                        <YAxis type="category" dataKey="feature" stroke="#94A3B8" fontSize={12} width={120} />
                        <Tooltip
                          contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#E2E8F0' }}
                          formatter={(value) => value.toFixed(4)}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {sampleData.map((entry, index) => (
                            <Cell key={index} fill={entry.value >= 0 ? '#10B981' : '#EF4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              <div className="mt-4 p-4 bg-surface-800/50 rounded-xl">
                <p className="text-xs text-surface-200/40 mb-2">How to read this chart:</p>
                <div className="flex items-center gap-6 text-xs">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-surface-200/60">Pushes toward positive (approved/hired)</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-surface-200/60">Pushes toward negative (rejected/denied)</span>
                  </span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Feature Summary Table */}
          <GlassCard hover={false}>
            <h3 className="font-semibold text-white mb-4">Feature Importance Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700/50">
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Rank</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Feature</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Importance</th>
                    <th className="text-left py-2 px-3 text-surface-200/60 font-medium">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {shapData.featureImportance?.map((feat, i) => (
                    <tr key={feat.feature} className="border-b border-surface-700/20 hover:bg-surface-800/30">
                      <td className="py-2 px-3 text-surface-200/40">{i + 1}</td>
                      <td className="py-2 px-3 text-white font-medium">{feat.feature}</td>
                      <td className="py-2 px-3 text-surface-200">{feat.importance.toFixed(4)}</td>
                      <td className="py-2 px-3">
                        <div className="w-32 bg-surface-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                            style={{
                              width: `${Math.min(100, (feat.importance / (shapData.featureImportance[0]?.importance || 1)) * 100)}%`
                            }}
                          />
                        </div>
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
