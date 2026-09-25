import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  FileText,
  Plus,
  Trash2,
  HeartPulse,
  Activity,
  Thermometer,
  Weight,
  Calendar,
  Save,
  CheckCircle,
  Pill
} from 'lucide-react';

export const EMRManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [patientDetail, setPatientDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  // New Consultation Form
  const [form, setForm] = useState({
    diagnosis: '',
    symptoms: '',
    clinical_notes: '',
    bp: '120/80 mmHg',
    pulse: '76 bpm',
    temperature: '98.6 F',
    weight: '70 kg',
    follow_up_date: ''
  });

  // Prescriptions List
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '500mg', frequency: 'Once daily', duration: '5 days', instructions: 'Take after meals' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pats, docs] = await Promise.all([
        api.getPatients(),
        api.getDoctors()
      ]);
      setPatients(pats);
      setDoctors(docs);
      if (pats.length > 0) {
        setSelectedPatientId(pats[0].id);
        fetchPatientEMR(pats[0].id);
      }
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientEMR = async (patId) => {
    try {
      const detail = await api.getPatientDetail(patId);
      setPatientDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientChange = (patId) => {
    setSelectedPatientId(patId);
    fetchPatientEMR(patId);
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: 'After meals' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, val) => {
    const updated = [...medicines];
    updated[index][field] = val;
    setMedicines(updated);
  };

  const handleSaveEMR = async (e) => {
    e.preventDefault();
    if (!form.diagnosis.trim()) {
      showToast('Please enter a clinical diagnosis', 'error');
      return;
    }

    try {
      const validPrescriptions = medicines.filter(m => m.name.trim().length > 0);
      await api.createMedicalRecord({
        patient_id: parseInt(selectedPatientId),
        doctor_id: parseInt(selectedDoctorId),
        visit_date: new Date().toISOString().split('T')[0],
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        clinical_notes: form.clinical_notes,
        bp: form.bp,
        pulse: form.pulse,
        temperature: form.temperature,
        weight: form.weight,
        follow_up_date: form.follow_up_date || null,
        prescriptions: validPrescriptions
      });

      showToast('Consultation notes & digital prescription saved successfully', 'success');
      fetchPatientEMR(selectedPatientId);
      setForm({
        diagnosis: '',
        symptoms: '',
        clinical_notes: '',
        bp: '120/80 mmHg',
        pulse: '76 bpm',
        temperature: '98.6 F',
        weight: '70 kg',
        follow_up_date: ''
      });
      setMedicines([{ name: '', dosage: '500mg', frequency: 'Once daily', duration: '5 days', instructions: 'Take after meals' }]);
    } catch (err) {
      showToast(err.message || 'Failed to save medical record', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Medical Record Management (EMR)
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Clinical encounter documentation, digital prescriptions, and vital sign logs
          </p>
        </div>

        {/* Patient Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569' }}>Selected Patient:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Vitals & Clinical Context Header */}
      {patientDetail && (
        <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {patientDetail.full_name} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>({patientDetail.patient_code})</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              {patientDetail.age} yrs • {patientDetail.gender} • Blood: <strong style={{ color: '#e11d48' }}>{patientDetail.blood_group}</strong> • Phone: {patientDetail.phone}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {patientDetail.allergies && (
              <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                Allergies: {patientDetail.allergies}
              </span>
            )}
            <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
              Past Visits: {patientDetail.medical_records?.length || 0}
            </span>
          </div>
        </div>
      )}

      {/* New Clinical Encounter & Prescription Form */}
      <form onSubmit={handleSaveEMR} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          New Clinical Consultation Encounter
        </h3>

        {/* Doctor & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Attending Doctor</label>
            <select
              className="form-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Follow-up Date (optional)</label>
            <input
              type="date"
              className="form-input"
              value={form.follow_up_date}
              onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
            />
          </div>
        </div>

        {/* Vitals Row */}
        <div>
          <label className="form-label">Patient Vitals at Check-in</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Blood Pressure</span>
              <input
                type="text"
                className="form-input"
                placeholder="120/80 mmHg"
                value={form.bp}
                onChange={(e) => setForm({ ...form, bp: e.target.value })}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pulse Rate</span>
              <input
                type="text"
                className="form-input"
                placeholder="76 bpm"
                value={form.pulse}
                onChange={(e) => setForm({ ...form, pulse: e.target.value })}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Body Temp</span>
              <input
                type="text"
                className="form-input"
                placeholder="98.6 F"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Weight</span>
              <input
                type="text"
                className="form-input"
                placeholder="70 kg"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Symptoms & Diagnosis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Reported Symptoms *</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              placeholder="e.g. Recurrent retrosternal chest pain, radiating to left arm..."
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Clinical Diagnosis *</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              placeholder="e.g. Primary Essential Hypertension with mild dyslipidemia"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Detailed Clinical Consultation Notes</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Clinical evaluation findings, auscultation, lifestyle recommendations..."
            value={form.clinical_notes}
            onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })}
          />
        </div>

        {/* Digital Prescription Builder */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
              <Pill size={16} color="#0d9488" />
              Digital Prescription Medicines
            </div>
            <button
              type="button"
              onClick={handleAddMedicineRow}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              <Plus size={13} /> Add Medicine
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {medicines.map((m, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Medicine name (e.g. Amlodipine)"
                  value={m.name}
                  onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Dosage (5mg)"
                  value={m.dosage}
                  onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Freq (Once daily)"
                  value={m.frequency}
                  onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Duration (14d)"
                  value={m.duration}
                  onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Instructions (After food)"
                  value={m.instructions}
                  onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedicineRow(idx)}
                  disabled={medicines.length === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', padding: '0.55rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save Consultation & Issue Prescription
          </button>
        </div>
      </form>

      {/* Historical Medical Records Table */}
      {patientDetail && patientDetail.medical_records?.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 800 }}>
            Past Consultation History for {patientDetail.full_name}
          </div>
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Attending Doctor</th>
                  <th>Diagnosis</th>
                  <th>Vitals Logged</th>
                  <th>Clinical Observations</th>
                </tr>
              </thead>
              <tbody>
                {patientDetail.medical_records.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{rec.visit_date}</span>
                    </td>
                    <td>
                      <div>{rec.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0d9488' }}>{rec.specialization}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a' }}>{rec.diagnosis}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        BP: {rec.bp || 'N/A'} • Pulse: {rec.pulse || 'N/A'} • Temp: {rec.temperature || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.8rem', color: '#334155', maxWidth: '300px' }}>
                        {rec.clinical_notes || rec.symptoms || 'Routine checkup completed'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
