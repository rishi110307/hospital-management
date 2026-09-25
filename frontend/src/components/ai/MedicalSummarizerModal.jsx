import React, { useState } from 'react';
import { api } from '../../services/api';
import { Sparkles, X, AlertTriangle, CheckCircle, FileText, UploadCloud, Info } from 'lucide-react';

const SAMPLE_REPORTS = [
  {
    title: 'Complete Blood Count (CBC) with Infection Flag',
    text: `Complete Blood Count (CBC)
Hemoglobin: 10.4 g/dL
WBC: 14200 cells/µL
Platelets: 210000 /µL`
  },
  {
    title: 'Comprehensive Lipid & Cholesterol Profile',
    text: `Fasting Lipid Panel
Cholesterol: 248 mg/dL
LDL: 165 mg/dL
HDL: 38 mg/dL
Triglycerides: 215 mg/dL`
  },
  {
    title: 'Diabetic & Metabolic Screening',
    text: `Diabetic Profile
Glucose: 142 mg/dL
HbA1c: 7.2 %
Creatinine: 1.1 mg/dL`
  }
];

export const MedicalSummarizerModal = ({ isOpen, onClose }) => {
  const [reportTitle, setReportTitle] = useState('Laboratory Diagnostic Report');
  const [rawText, setRawText] = useState(SAMPLE_REPORTS[0].text);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const data = await api.summarizeMedicalReport(rawText, reportTitle);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample) => {
    setReportTitle(sample.title);
    setRawText(sample.text);
    setResult(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-fade-in"
        style={{
          width: '780px',
          maxWidth: '95vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                AI Medical Report Summarizer
              </div>
              <div style={{ fontSize: '0.725rem', opacity: 0.85 }}>
                Extracts clinical markers and translates into clear plain language
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Sample Presets */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Load Demo Report Presets:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SAMPLE_REPORTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc' }}
                >
                  <FileText size={13} color="#0d9488" />
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Report Title</label>
              <input
                type="text"
                className="form-input"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. CBC Routine Checkup"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Report Data / Clinical Parameters</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste raw lab results e.g. Hemoglobin: 13.2 g/dL, WBC: 7200 cells/µL..."
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !rawText.trim()}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              <Sparkles size={16} />
              {loading ? 'Analyzing Clinical Markers...' : 'Generate Layman Summary'}
            </button>
          </div>

          {/* Analysis Results Display */}
          {result && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              {/* Extracted Metrics Table */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: '#0f172a' }}>
                  Extracted Clinical Values & Reference Intervals
                </h4>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Marker / Test</th>
                        <th>Reported Value</th>
                        <th>Reference Interval</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.extracted_parameters.map((param, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{param.test}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {param.value} {param.unit}
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{param.reference_interval}</td>
                          <td>
                            <span className={`badge badge-${param.badge_color}`}>
                              {param.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Layman Explanation */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={16} color="#0d9488" />
                  Plain Language Explanation
                </div>
                <div style={{ fontSize: '0.825rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {result.summary}
                </div>
              </div>

              {/* Mandatory Medical Disclaimer Banner */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309' }}>
                    Important Medical Disclaimer
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#92400e', marginTop: '0.15rem', fontStyle: 'italic' }}>
                    "{result.disclaimer}"
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
