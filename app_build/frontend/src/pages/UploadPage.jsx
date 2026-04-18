/**
 * FairLens AI — Upload Page
 * Dataset upload, preview, sensitive attribute config, and model training.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetAPI, biasAPI } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineCloudUpload,
  HiOutlineTable,
  HiOutlineShieldCheck,
  HiOutlinePlay,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1); // 1=upload, 2=configure, 3=training
  const [dataset, setDataset] = useState(null);
  const [selectedSensitive, setSelectedSensitive] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [modelType, setModelType] = useState('logistic_regression');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if dataset was loaded from demo
  useEffect(() => {
    const saved = sessionStorage.getItem('fairlens_dataset');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setDataset(data);
        setSelectedSensitive(data.sensitiveAttributes || []);
        setTargetColumn(data.suggestedTargets?.[0] || '');
        setStep(2);
      } catch (e) {
        console.error('Failed to parse saved dataset');
      }
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await datasetAPI.upload(file);
      setDataset({
        datasetId: data.datasetId,
        name: data.name,
        preview: data.preview,
        sensitiveAttributes: data.sensitiveAttributes.map(a => a.name),
        suggestedTargets: data.suggestedTargets,
      });
      setSelectedSensitive(data.sensitiveAttributes.map(a => a.name));
      if (data.suggestedTargets?.length > 0) {
        setTargetColumn(data.suggestedTargets[0]);
      }
      sessionStorage.setItem('fairlens_dataset', JSON.stringify({
        datasetId: data.datasetId,
        name: data.name,
        preview: data.preview,
        sensitiveAttributes: data.sensitiveAttributes.map(a => a.name),
        suggestedTargets: data.suggestedTargets,
      }));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const toggleSensitive = (attr) => {
    setSelectedSensitive(prev =>
      prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]
    );
  };

  const handleTrainAndAnalyze = async () => {
    if (!targetColumn || selectedSensitive.length === 0) {
      setError('Please select a target column and at least one sensitive attribute.');
      return;
    }

    setLoading(true);
    setError('');
    setStep(3);

    try {
      // Train model
      const trainRes = await biasAPI.trainModel({
        datasetId: dataset.datasetId,
        targetColumn,
        sensitiveAttributes: selectedSensitive,
        modelType,
      });

      // Run bias analysis
      const analysisRes = await biasAPI.analyze({ modelId: trainRes.data.modelId });

      // Store results
      sessionStorage.setItem('fairlens_model', JSON.stringify(trainRes.data));
      sessionStorage.setItem('fairlens_analysis', JSON.stringify(analysisRes.data));
      sessionStorage.setItem('fairlens_dataset_name', dataset.name || 'Dataset');

      navigate('/dashboard/audit');
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-2">Upload & Configure Dataset</h1>
        <p className="text-surface-200/60">Upload a CSV/Excel file or use a pre-loaded demo dataset.</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { n: 1, label: 'Upload' },
          { n: 2, label: 'Configure' },
          { n: 3, label: 'Analyze' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${step >= s.n
                ? 'bg-primary-500 text-white shadow-glow-primary'
                : 'bg-surface-800 text-surface-200/40'
              }`}>
              {step > s.n ? <HiOutlineCheckCircle className="w-5 h-5" /> : s.n}
            </div>
            <span className={`text-sm font-medium ${step >= s.n ? 'text-white' : 'text-surface-200/40'}`}>
              {s.label}
            </span>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-primary-500' : 'bg-surface-800'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <HiOutlineExclamation className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <GlassCard hover={false} className="p-0">
              <div
                {...getRootProps()}
                className={`p-12 text-center cursor-pointer border-2 border-dashed rounded-2xl transition-all
                  ${isDragActive
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-surface-700/50 hover:border-primary-500/30 hover:bg-surface-800/30'
                  }`}
              >
                <input {...getInputProps()} />
                {loading ? (
                  <LoadingSpinner size="lg" text="Parsing dataset..." />
                ) : (
                  <>
                    <HiOutlineCloudUpload className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-primary-400' : 'text-surface-200/30'}`} />
                    <p className="text-lg font-medium text-white mb-2">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your dataset'}
                    </p>
                    <p className="text-sm text-surface-200/50 mb-4">
                      or click to browse • CSV, Excel up to 50MB
                    </p>
                    <button className="btn-secondary text-sm">Browse Files</button>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && dataset && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Data Preview */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-3 mb-4">
                <HiOutlineTable className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">Data Preview</h3>
                <span className="text-xs text-surface-200/40">
                  {dataset.preview?.totalRows?.toLocaleString()} rows × {dataset.preview?.totalColumns} columns
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-700/50">
                      {dataset.preview?.columns?.map(col => (
                        <th key={col.name} className="text-left py-2 px-3 text-surface-200/60 font-medium whitespace-nowrap">
                          {col.name}
                          <span className="block text-xs text-surface-200/30">{col.dtype}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.preview?.preview?.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-surface-700/20 hover:bg-surface-800/30">
                        {dataset.preview?.columns?.map(col => (
                          <td key={col.name} className="py-2 px-3 text-surface-200 whitespace-nowrap">
                            {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Configuration */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Target Column */}
              <GlassCard hover={false}>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <HiOutlinePlay className="w-5 h-5 text-accent-400" />
                  Target Column
                </h3>
                <p className="text-xs text-surface-200/40 mb-3">The decision/outcome column to audit</p>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:border-primary-500 outline-none"
                >
                  <option value="">Select target column</option>
                  {dataset.preview?.columns?.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <div className="mt-4">
                  <label className="text-xs text-surface-200/40 mb-2 block">Model Type</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:border-primary-500 outline-none"
                  >
                    <option value="logistic_regression">Logistic Regression</option>
                    <option value="random_forest">Random Forest</option>
                  </select>
                </div>
              </GlassCard>

              {/* Sensitive Attributes */}
              <GlassCard hover={false}>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-5 h-5 text-amber-400" />
                  Sensitive Attributes
                </h3>
                <p className="text-xs text-surface-200/40 mb-3">Select protected characteristics to audit</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dataset.preview?.columns
                    ?.filter(c => c.name !== targetColumn)
                    .map(col => (
                      <label
                        key={col.name}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                          ${selectedSensitive.includes(col.name)
                            ? 'bg-primary-500/10 border border-primary-500/30'
                            : 'hover:bg-surface-800 border border-transparent'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSensitive.includes(col.name)}
                          onChange={() => toggleSensitive(col.name)}
                          className="w-4 h-4 rounded border-surface-700 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-surface-200">{col.name}</span>
                        {dataset.sensitiveAttributes?.includes(col.name) && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                            auto-detected
                          </span>
                        )}
                      </label>
                    ))}
                </div>
              </GlassCard>
            </div>

            {/* Run Analysis button */}
            <button
              onClick={handleTrainAndAnalyze}
              disabled={!targetColumn || selectedSensitive.length === 0 || loading}
              className="btn-accent w-full md:w-auto text-lg px-8 py-4 flex items-center gap-3"
            >
              {loading ? <LoadingSpinner size="sm" /> : <HiOutlinePlay className="w-5 h-5" />}
              Train Model & Run Bias Analysis
            </button>
          </motion.div>
        )}

        {/* Step 3: Training */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-lg text-white mt-6 font-medium">Training model & analyzing bias...</p>
              <p className="text-sm text-surface-200/50 mt-2">This may take a few seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
