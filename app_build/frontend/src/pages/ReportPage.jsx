/**
 * FairLens AI — Report Page
 * Generate and download PDF audit reports.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reportAPI, geminiAPI } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import {
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

export default function ReportPage() {
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [includeGemini, setIncludeGemini] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const savedModel = sessionStorage.getItem('fairlens_model');
    const savedName = sessionStorage.getItem('fairlens_dataset_name');
    if (savedModel) setModel(JSON.parse(savedModel));
    if (savedName) setDatasetName(savedName);
  }, []);

  const handleGenerateReport = async () => {
    if (!model) return;
    setGenerating(true);
    setError('');
    try {
      const response = await reportAPI.generate({
        modelId: model.modelId,
        datasetName: datasetName || 'Dataset',
        includeGemini,
      });

      // Download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FairLens_Audit_${datasetName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setGenerated(true);
    } catch (err) {
      setError('Report generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecutiveSummary = async () => {
    if (!model) return;
    setLoadingSummary(true);
    try {
      const { data } = await geminiAPI.executiveSummary({
        modelId: model.modelId,
        datasetName,
      });
      setExecutiveSummary(data.summary);
    } catch (err) {
      setExecutiveSummary('Failed to generate executive summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!model) {
    return (
      <div className="text-center py-20">
        <HiOutlineDocumentReport className="w-16 h-16 mx-auto text-surface-200/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Audit Data Available</h2>
        <p className="text-surface-200/50 mb-6">Complete a bias analysis first to generate reports.</p>
        <button onClick={() => navigate('/dashboard/upload')} className="btn-primary">Go to Upload</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Audit Reports</h1>
        <p className="text-surface-200/60">Generate compliance-ready PDF reports with AI-powered summaries.</p>
      </motion.div>

      {/* Report Configuration */}
      <GlassCard hover={false}>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineDocumentReport className="w-5 h-5 text-primary-400" />
          Report Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-surface-200/60 mb-1 block">Dataset Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGemini}
                onChange={(e) => setIncludeGemini(e.target.checked)}
                className="w-4 h-4 rounded border-surface-700 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-200">Include AI-generated compliance summary (Gemini)</span>
            </label>
          </div>

          <div className="pt-2">
            <p className="text-xs text-surface-200/40 mb-4">
              The report will include: bias metrics, group breakdowns, severity assessment, and optionally
              AI-generated analysis and mitigation recommendations.
            </p>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="btn-primary flex items-center gap-3 text-lg"
            >
              {generating ? (
                <LoadingSpinner size="sm" />
              ) : generated ? (
                <HiOutlineCheckCircle className="w-5 h-5" />
              ) : (
                <HiOutlineDownload className="w-5 h-5" />
              )}
              {generating ? 'Generating...' : generated ? 'Download Again' : 'Generate PDF Report'}
            </button>
          </div>

          {generated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3"
            >
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-400">Report generated and downloaded successfully!</p>
            </motion.div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
          )}
        </div>
      </GlassCard>

      {/* Executive Summary Preview */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <HiOutlineSparkles className="w-5 h-5 text-accent-400" />
            Executive Summary Preview
          </h3>
          {!executiveSummary && (
            <button
              onClick={handleExecutiveSummary}
              disabled={loadingSummary}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {loadingSummary ? <LoadingSpinner size="sm" /> : <HiOutlineSparkles className="w-4 h-4" />}
              Generate Preview
            </button>
          )}
        </div>

        {executiveSummary ? (
          <div className="markdown-content prose prose-invert max-w-none">
            <ReactMarkdown>{executiveSummary}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-surface-200/40">
            Click "Generate Preview" to see the AI-generated executive summary that will be included in your report.
          </p>
        )}
      </GlassCard>

      {/* Report Contents Overview */}
      <GlassCard hover={false}>
        <h3 className="font-semibold text-white mb-4">What's Included in the Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Report Metadata & Date',
            'Overall Bias Level Assessment',
            'Detailed Metrics per Attribute',
            'Group Breakdown Tables',
            'Demographic Parity Analysis',
            'Equal Opportunity Analysis',
            'Disparate Impact Ratio',
            'Statistical Parity Analysis',
            'AI-Generated Analysis (optional)',
            'Mitigation Recommendations (optional)',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-surface-200/60">
              <HiOutlineCheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
