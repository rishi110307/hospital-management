import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  FlaskConical,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  FileCheck,
  AlertTriangle,
  X
} from 'lucide-react';

export const LabManagement = () => {
  const [reports, setReports] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'catalog'

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedReportForResults, setSelectedReportForResults] = useState(null);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);

  const { showToast } = useNotification();

  // Order Form
  const [orderForm, setOrderForm] = useState({
    patient_id: '',
    doctor_id: '',
    test_id: '',
    notes: ''
  });

  // Result Entry Form
  const [resultForm, setResultForm] = useState({
    sample_status: 'Completed',
    result_value: '',
    normal_range: '',
    interpretation: 'Normal',
    notes: ''
  });

  useEffect(() => {
    fetchReports();
    loadCatalogAndEntities();
  }, [statusFilter]);

  const loadCatalogAndEntities = async () => {
    try {
      const [cat, pats, docs] = await Promise.all([
        api.getLabCatalog(),
        api.getPatients(),
        api.getDoctors()
      ]);
      setCatalog(cat);
      setPatients(pats);
      setDoctors(docs);
      if (cat.length > 0) setOrderForm(f => ({ ...f, test_id: cat[0].id }));
      if (pats.length > 0) setOrderForm(f => ({ ...f, patient_id: pats[0].id }));
      if (docs.length > 0) setOrderForm(f => ({ ...f, doctor_id: docs[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const data = await api.getLabReports(params.toString());
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.orderLabTest({
        test_id: parseInt(orderForm.test_id),
        patient_id: parseInt(orderForm.patient_id),
        doctor_id: parseInt(orderForm.doctor_id) || null,
        notes: orderForm.notes
      });
      showToast('Diagnostic test ordered successfully', 'success');
      setShowOrderModal(false);
      fetchReports();
    } catch (err) {
      showToast('Failed to order test', 'error');
    }
  };

  const handleOpenResults = (rep) => {
    setSelectedReportForResults(rep);
    setResultForm({
      sample_status: rep.sample_status === 'Ordered' ? 'Sample Collected' : 'Completed',
      result_value: rep.result_value || '',
      normal_range: rep.normal_range || '',
      interpretation: rep.interpretation || 'Normal',
      notes: rep.notes || ''
    });
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    try {
      await api.updateLabResult(selectedReportForResults.id, resultForm);
      showToast('Lab report updated and patient/doctor notified', 'success');
      setSelectedReportForResults(null);
      fetchReports();
    } catch (err) {
      showToast('Failed to save test results', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Laboratory & Diagnostics Management
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Complete workflow: Test Order → Sample Collection → Analysis → Digital Verification & Printable Report
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('orders')}
              style={{
                border: 'none',
                background: activeTab === 'orders' ? '#ffffff' : 'transparent',
                color: activeTab === 'orders' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Test Orders ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                border: 'none',
                background: activeTab === 'catalog' ? '#ffffff' : 'transparent',
                color: activeTab === 'catalog' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Test Catalog ({catalog.length})
            </button>
          </div>

          <button
            onClick={() => setShowOrderModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Order Lab Test
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'orders' ? (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Sample Statuses</option>
                <option value="Ordered">Ordered</option>
                <option value="Sample Collected">Sample Collected</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Workflow: <strong>Ordered</strong> → <strong>Collected</strong> → <strong>Processing</strong> → <strong>Completed</strong>
            </span>
          </div>

          {/* Reports Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Test Name</th>
                    <th>Patient Name</th>
                    <th>Order Date</th>
                    <th>Sample Status</th>
                    <th>Interpretation</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading lab tests...</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No lab orders found.</td></tr>
                  ) : (
                    reports.map(r => {
                      let badge = 'badge-blue';
                      if (r.sample_status === 'Sample Collected') badge = 'badge-purple';
                      if (r.sample_status === 'Processing') badge = 'badge-amber';
                      if (r.sample_status === 'Completed') badge = 'badge-emerald';

                      return (
                        <tr key={r.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              LAB-{r.id.toString().padStart(4, '0')}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.test_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.category} • {r.sample_type}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.patient_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {r.patient_code}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem' }}>{r.order_date}</span>
                          </td>
                          <td>
                            <span className={`badge ${badge}`}>
                              {r.sample_status}
                            </span>
                          </td>
                          <td>
                            {r.interpretation ? (
                              <span className={`badge badge-${r.interpretation === 'Normal' ? 'emerald' : r.interpretation === 'High' ? 'rose' : 'amber'}`}>
                                {r.interpretation}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Awaiting Analysis</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleOpenResults(r)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                {r.sample_status === 'Completed' ? 'Edit Result' : 'Enter Result'}
                              </button>
                              {r.sample_status === 'Completed' && (
                                <button
                                  onClick={() => setSelectedReportForPrint(r)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#0d9488' }}
                                  title="Print Official Diagnostic Report"
                                >
                                  <Printer size={13} /> Report
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Test Catalog Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {catalog.map(t => (
            <div key={t.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '0.68rem', marginBottom: '0.4rem' }}>
                  {t.category}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {t.test_name}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                  Sample: <strong>{t.sample_type}</strong> • Turnaround: ~{t.turnaround_hours}h
                </div>
                <div style={{ fontSize: '0.735rem', color: '#334155', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                  Ref Range: {t.normal_range}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                  ${t.price.toFixed(2)}
                </span>
                <button
                  onClick={() => {
                    setOrderForm(f => ({ ...f, test_id: t.id }));
                    setShowOrderModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Order Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Entry Modal */}
      {selectedReportForResults && (
        <div className="modal-overlay" onClick={() => setSelectedReportForResults(null)}>
          <div
            className="card animate-fade-in"
            style={{ width: '600px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Enter Diagnostic Results</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {selectedReportForResults.test_name} • Patient: {selectedReportForResults.patient_name}
                </div>
              </div>
              <button onClick={() => setSelectedReportForResults(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResults} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Workflow Status</label>
                  <select
                    className="form-select"
                    value={resultForm.sample_status}
                    onChange={(e) => setResultForm({ ...resultForm, sample_status: e.target.value })}
                  >
                    <option value="Sample Collected">Sample Collected</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Interpretation</label>
                  <select
                    className="form-select"
                    value={resultForm.interpretation}
                    onChange={(e) => setResultForm({ ...resultForm, interpretation: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Result Value / Parameter Findings *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="e.g. Hb: 13.8 g/dL, Total RBC: 4.8 million/uL, Platelets: 240,000/uL..."
                  value={resultForm.result_value}
                  onChange={(e) => setResultForm({ ...resultForm, result_value: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Normal Reference Range</label>
                <input
                  type="text"
                  className="form-input"
                  value={resultForm.normal_range}
                  onChange={(e) => setResultForm({ ...resultForm, normal_range: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Technician Observations / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Verified on automated analyzer. Morphology unremarkable."
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReportForResults(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save & Finalize Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Test Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '560px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Order Diagnostic Test</h3>
              <button onClick={() => setShowOrderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-select"
                  value={orderForm.patient_id}
                  onChange={(e) => setOrderForm({ ...orderForm, patient_id: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Lab Test *</label>
                <select
                  required
                  className="form-select"
                  value={orderForm.test_id}
                  onChange={(e) => setOrderForm({ ...orderForm, test_id: e.target.value })}
                >
                  {catalog.map(t => (
                    <option key={t.id} value={t.id}>{t.test_name} – ${t.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ordering Physician</label>
                <select
                  className="form-select"
                  value={orderForm.doctor_id}
                  onChange={(e) => setOrderForm({ ...orderForm, doctor_id: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clinical Indication / Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fasting sample requested, rule out infection"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Submit Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {selectedReportForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedReportForPrint(null)}>
          <div
            className="card animate-fade-in"
            style={{ width: '700px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hospital Letterhead */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  SmartCare Central Diagnostic Laboratories
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  CAP & NABL Accredited Automated Pathology Center • Floor B1, Wing A
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>OFFICIAL REPORT</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0d9488' }}>
                  LAB-{selectedReportForPrint.id.toString().padStart(4, '0')}
                </div>
              </div>
            </div>

            {/* Patient Header */}
            <div style={{ margin: '1.25rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem', backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Patient Name:</span> <strong>{selectedReportForPrint.patient_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Patient ID:</span> <strong>{selectedReportForPrint.patient_code}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Ref Doctor:</span> <strong>{selectedReportForPrint.doctor_name || 'Staff Physician'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Reported At:</span> <strong>{selectedReportForPrint.completed_at || selectedReportForPrint.order_date}</strong>
              </div>
            </div>

            {/* Test Details */}
            <div style={{ margin: '1.25rem 0' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {selectedReportForPrint.test_name}
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {selectedReportForPrint.result_value}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                  Normal Reference Range: {selectedReportForPrint.normal_range}
                </div>
                {selectedReportForPrint.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.35rem' }}>
                    Note: {selectedReportForPrint.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified by Automated Diagnostic LIMS</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SmartCare Hospital Software Engine</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.3rem', color: '#1e293b' }}>Dr. Robert Chen</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: '0.2rem' }}>
                  Chief Clinical Pathologist
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                <Printer size={14} /> Print Report
              </button>
              <button onClick={() => setSelectedReportForPrint(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
