import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  AlertOctagon,
  Plus,
  Filter,
  UserCheck,
  BedDouble,
  Droplet,
  Phone,
  Clock,
  ShieldAlert,
  Activity,
  X
} from 'lucide-react';

export const EmergencyView = () => {
  const [cases, setCases] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [bloodInventory, setBloodInventory] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useNotification();

  const [form, setForm] = useState({
    patient_name: '',
    age: '',
    gender: 'Male',
    triage_priority: 'Critical',
    emergency_type: 'Acute Coronary Syndrome',
    assigned_doctor_id: '',
    assigned_bed_id: '',
    blood_group: 'O+',
    emergency_contact: '',
    notes: ''
  });

  useEffect(() => {
    fetchEmergencyCases();
    loadResources();
  }, [priorityFilter]);

  const loadResources = async () => {
    try {
      const [docs, bedMatrix, blood] = await Promise.all([
        api.getDoctors(),
        api.getBedMatrix(),
        api.getBloodInventory()
      ]);
      setDoctors(docs);
      const beds = bedMatrix.flatMap(w => w.beds).filter(b => b.status === 'Available');
      setAvailableBeds(beds);
      setBloodInventory(blood);
      if (docs.length > 0) setForm(f => ({ ...f, assigned_doctor_id: docs[0].id }));
      if (beds.length > 0) setForm(f => ({ ...f, assigned_bed_id: beds[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmergencyCases = async () => {
    try {
      const params = new URLSearchParams();
      if (priorityFilter) params.append('priority', priorityFilter);
      const data = await api.getEmergencyCases(params.toString());
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmergency = async (e) => {
    e.preventDefault();
    try {
      await api.createEmergencyCase({
        ...form,
        age: parseInt(form.age) || 30,
        assigned_doctor_id: parseInt(form.assigned_doctor_id) || null,
        assigned_bed_id: parseInt(form.assigned_bed_id) || null
      });
      showToast(`Emergency case registered with priority: ${form.triage_priority}`, 'success');
      setShowModal(false);
      fetchEmergencyCases();
      loadResources();
    } catch (err) {
      showToast('Failed to register emergency case', 'error');
    }
  };

  const handleUpdateStatus = async (caseId, status) => {
    try {
      await api.updateEmergencyCase(caseId, { status });
      showToast(`Emergency status updated to ${status}`, 'success');
      fetchEmergencyCases();
      loadResources();
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  const availableICUBedsCount = availableBeds.filter(b => b.bed_number.startsWith('ICU') || b.bed_number.startsWith('CCU')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertOctagon size={24} /> 24/7 Emergency & Acute Trauma Triage
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Rapid triage priority assessment, attending physician assignment, and instant resuscitation resource tracking
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-danger"
          style={{ boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' }}
        >
          <Plus size={16} /> Register Emergency Case
        </button>
      </div>

      {/* Emergency Resources Quick Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active ER Patients</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626' }}>
            {cases.filter(c => c.status === 'Under Treatment').length}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Available ICU/CCU Beds</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>
            {availableICUBedsCount} Beds
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ER Doctors On-Call</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb' }}>
            {doctors.filter(d => d.specialization.includes('Emergency') || d.available_status === 'Available').length} Doctors
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #be123c' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>O- Blood Units (Universal)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#be123c' }}>
            {bloodInventory.find(b => b.blood_group === 'O-')?.units_available || 0} Units
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Triage Priorities</option>
            <option value="Critical">🔴 Critical (Immediate Resuscitation)</option>
            <option value="Urgent">🟡 Urgent (High Acuity)</option>
            <option value="Stable">🟢 Stable (Standard Observation)</option>
          </select>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Sorted by clinical acuity (Critical first)
        </span>
      </div>

      {/* Emergency Cases Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading emergency cases...</div>
        ) : cases.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            No active emergency cases reported in this category.
          </div>
        ) : (
          cases.map(ec => {
            let priorityBadge = 'badge-rose';
            let borderAccent = '#ef4444';
            if (ec.triage_priority === 'Urgent') {
              priorityBadge = 'badge-amber';
              borderAccent = '#f59e0b';
            } else if (ec.triage_priority === 'Stable') {
              priorityBadge = 'badge-emerald';
              borderAccent = '#10b981';
            }

            return (
              <div
                key={ec.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderLeft: `5px solid ${borderAccent}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`badge ${priorityBadge}`} style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                        {ec.triage_priority.toUpperCase()}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {ec.patient_name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        ({ec.age} yrs • {ec.gender})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc2626', marginTop: '0.35rem' }}>
                      Diagnosis / Trauma: {ec.emergency_type}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-gray">
                      {ec.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {ec.arrival_time?.split('T')[1]?.slice(0, 5) || 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Details Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  backgroundColor: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheck size={14} color="#0d9488" />
                    <span>Attending: <strong>{ec.doctor_name || 'Dr. Alexander Wright (ER)'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BedDouble size={14} color="#2563eb" />
                    <span>Bed: <strong style={{ color: '#2563eb' }}>{ec.bed_number ? `${ec.bed_number} (${ec.ward_name})` : 'Triage Bay'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Droplet size={14} color="#e11d48" />
                    <span>Blood: <strong style={{ color: '#e11d48' }}>{ec.blood_group || 'Pending'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="#64748b" />
                    <span>ICE: {ec.emergency_contact || 'None listed'}</span>
                  </div>
                </div>

                {ec.notes && (
                  <p style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', margin: 0 }}>
                    "{ec.notes}"
                  </p>
                )}

                {/* Status action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  {ec.status === 'Under Treatment' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(ec.id, 'Admitted')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Transfer to Inpatient
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ec.id, 'Discharged')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', color: '#059669', borderColor: '#a7f3d0' }}
                      >
                        Discharge Stabilized
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register Emergency Case Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '600px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
                Register Acute Emergency Triage Case
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmergency} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Patient Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Patient Name or Unknown EMT John Doe"
                    value={form.patient_name}
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-input"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="45"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Triage Priority *</label>
                  <select
                    className="form-select"
                    value={form.triage_priority}
                    onChange={(e) => setForm({ ...form, triage_priority: e.target.value })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Critical">🔴 Critical (Immediate)</option>
                    <option value="Urgent">🟡 Urgent (High Acuity)</option>
                    <option value="Stable">🟢 Stable</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={form.blood_group}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Emergency Type / Chief Complaint *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Acute Myocardial Infarction, Severe Multi-trauma, Stroke"
                  value={form.emergency_type}
                  onChange={(e) => setForm({ ...form, emergency_type: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assign ER Doctor</label>
                  <select
                    className="form-select"
                    value={form.assigned_doctor_id}
                    onChange={(e) => setForm({ ...form, assigned_doctor_id: e.target.value })}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Allocate Available Bed</label>
                  <select
                    className="form-select"
                    value={form.assigned_bed_id}
                    onChange={(e) => setForm({ ...form, assigned_bed_id: e.target.value })}
                  >
                    <option value="">Hold in ER Triage Area</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>Bed {b.bed_number} (${b.daily_rate?.toFixed(0)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Emergency Contact (ICE)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Accompanying person / Paramedic contact"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clinical Triage Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Initial vitals, GCS score, trauma severity, immediate medication given..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Admit to Emergency Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
