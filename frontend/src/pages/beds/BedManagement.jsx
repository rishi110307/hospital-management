import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  BedDouble,
  Filter,
  Plus,
  ArrowRightLeft,
  LogOut,
  UserCheck,
  CheckCircle,
  AlertOctagon,
  Clock,
  X
} from 'lucide-react';

export const BedManagement = () => {
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wardTypeFilter, setWardTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  const [selectedBed, setSelectedBed] = useState(null);
  const { showToast } = useNotification();

  // Forms
  const [admitForm, setAdmitForm] = useState({
    patient_id: '',
    bed_id: '',
    doctor_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    initial_diagnosis: ''
  });

  const [transferForm, setTransferForm] = useState({
    current_bed_id: '',
    new_bed_id: '',
    patient_id: '',
    notes: ''
  });

  const [dischargeForm, setDischargeForm] = useState({
    admission_id: '',
    bed_id: '',
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_summary: ''
  });

  useEffect(() => {
    fetchBeds();
    loadEntities();
  }, [wardTypeFilter]);

  const loadEntities = async () => {
    try {
      const [pats, docs] = await Promise.all([
        api.getPatients(),
        api.getDoctors()
      ]);
      setPatients(pats);
      setDoctors(docs);
      if (pats.length > 0) setAdmitForm(f => ({ ...f, patient_id: pats[0].id }));
      if (docs.length > 0) setAdmitForm(f => ({ ...f, doctor_id: docs[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBeds = async () => {
    try {
      const data = await api.getBedMatrix(wardTypeFilter);
      setWards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdmit = (bed) => {
    setSelectedBed(bed);
    setAdmitForm(f => ({ ...f, bed_id: bed.id }));
    setShowAdmitModal(true);
  };

  const handleOpenTransfer = (bed) => {
    setSelectedBed(bed);
    setTransferForm({
      current_bed_id: bed.id,
      new_bed_id: '',
      patient_id: bed.current_patient_id,
      notes: ''
    });
    setShowTransferModal(true);
  };

  const handleOpenDischarge = (bed) => {
    setSelectedBed(bed);
    setDischargeForm({
      admission_id: bed.admission_id || 1,
      bed_id: bed.id,
      discharge_date: new Date().toISOString().split('T')[0],
      discharge_summary: 'Patient vitals stable. Discharged in satisfactory condition.'
    });
    setShowDischargeModal(true);
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    try {
      await api.admitPatient({
        patient_id: parseInt(admitForm.patient_id),
        bed_id: parseInt(admitForm.bed_id),
        doctor_id: parseInt(admitForm.doctor_id) || null,
        admission_date: admitForm.admission_date,
        initial_diagnosis: admitForm.initial_diagnosis
      });
      showToast('Patient admitted successfully and bed status set to Occupied', 'success');
      setShowAdmitModal(false);
      fetchBeds();
    } catch (err) {
      showToast(err.message || 'Admission failed', 'error');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.transferPatient({
        current_bed_id: parseInt(transferForm.current_bed_id),
        new_bed_id: parseInt(transferForm.new_bed_id),
        patient_id: parseInt(transferForm.patient_id),
        notes: transferForm.notes
      });
      showToast('Patient transferred successfully to new ward/bed', 'success');
      setShowTransferModal(false);
      fetchBeds();
    } catch (err) {
      showToast(err.message || 'Transfer failed', 'error');
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    try {
      await api.dischargePatient({
        admission_id: parseInt(dischargeForm.admission_id),
        bed_id: parseInt(dischargeForm.bed_id),
        discharge_date: dischargeForm.discharge_date,
        discharge_summary: dischargeForm.discharge_summary
      });
      showToast('Patient discharged and bed is now Available', 'success');
      setShowDischargeModal(false);
      fetchBeds();
    } catch (err) {
      showToast(err.message || 'Discharge failed', 'error');
    }
  };

  // Find all available beds for transfer dropdown
  const allAvailableBeds = wards.flatMap(w => w.beds).filter(b => b.status === 'Available');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Visual Bed & Room Management Matrix
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Real-time ward occupancy, ICU tracking, patient admissions, ward transfers, and discharges
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Occupied
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span> Reserved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span> Maintenance
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Filter size={16} color="#64748b" />
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          value={wardTypeFilter}
          onChange={(e) => setWardTypeFilter(e.target.value)}
        >
          <option value="">All Ward Types</option>
          <option value="ICU">Intensive Care Unit (ICU / CCU)</option>
          <option value="Emergency">Emergency Trauma Bay</option>
          <option value="Private">Deluxe Private Suites</option>
          <option value="General">General Medical Wards</option>
        </select>
      </div>

      {/* Ward Cards and Visual Bed Matrix */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading bed matrix...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {wards.map(w => (
            <div key={w.id} className="card" style={{ padding: '1.25rem' }}>
              {/* Ward Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {w.name}
                    </h3>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                      {w.ward_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {w.floor} • Total Capacity: {w.total_beds} Beds
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {w.available_count} Available
                  </span>
                  <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {w.occupied_count} Occupied
                  </span>
                </div>
              </div>

              {/* Visual Bed Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.85rem'
              }}>
                {w.beds.map(b => {
                  let borderColor = '#10b981';
                  let bgColor = '#ecfdf5';
                  let statusColor = '#047857';

                  if (b.status === 'Occupied') {
                    borderColor = '#f87171';
                    bgColor = '#fef2f2';
                    statusColor = '#b91c1c';
                  } else if (b.status === 'Reserved') {
                    borderColor = '#fbbf24';
                    bgColor = '#fffbeb';
                    statusColor = '#b45309';
                  } else if (b.status === 'Maintenance') {
                    borderColor = '#cbd5e1';
                    bgColor = '#f8fafc';
                    statusColor = '#64748b';
                  }

                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                            {b.bed_number}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>
                            {b.status}
                          </span>
                        </div>

                        {b.status === 'Occupied' ? (
                          <div style={{ marginTop: '0.4rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                              {b.patient_name || 'Patient Admitted'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {b.patient_code} • {b.patient_age}y / {b.patient_gender}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.2rem' }}>
                              Doc: <strong>{b.attending_doctor || 'Attending Physician'}</strong>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                            Daily Rate: <strong>${b.daily_rate?.toFixed(2)}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.2rem' }}>
                              Ready for Patient Admission
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {b.status === 'Available' && (
                          <button
                            onClick={() => handleOpenAdmit(b)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                          >
                            Admit
                          </button>
                        )}
                        {b.status === 'Occupied' && (
                          <>
                            <button
                              onClick={() => handleOpenTransfer(b)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem' }}
                              title="Transfer Bed"
                            >
                              <ArrowRightLeft size={12} /> Transfer
                            </button>
                            <button
                              onClick={() => handleOpenDischarge(b)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', color: '#dc2626' }}
                              title="Discharge Patient"
                            >
                              <LogOut size={12} /> Discharge
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admit Modal */}
      {showAdmitModal && selectedBed && (
        <div className="modal-overlay" onClick={() => setShowAdmitModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '560px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                Admit Patient to Bed {selectedBed.bed_number}
              </h3>
              <button onClick={() => setShowAdmitModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-select"
                  value={admitForm.patient_id}
                  onChange={(e) => setAdmitForm({ ...admitForm, patient_id: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Attending Doctor</label>
                <select
                  className="form-select"
                  value={admitForm.doctor_id}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctor_id: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Admission Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={admitForm.admission_date}
                  onChange={(e) => setAdmitForm({ ...admitForm, admission_date: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Initial Diagnosis / Reason for Admission</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  required
                  placeholder="e.g. Acute exacerbation of COPD, post-operative observation"
                  value={admitForm.initial_diagnosis}
                  onChange={(e) => setAdmitForm({ ...admitForm, initial_diagnosis: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAdmitModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Inpatient Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedBed && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '560px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                Transfer Patient from Bed {selectedBed.bed_number}
              </h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Patient: <strong>{selectedBed.patient_name}</strong> ({selectedBed.patient_code})
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target Available Bed / Room *</label>
                <select
                  required
                  className="form-select"
                  value={transferForm.new_bed_id}
                  onChange={(e) => setTransferForm({ ...transferForm, new_bed_id: e.target.value })}
                >
                  <option value="">Choose target available bed...</option>
                  {allAvailableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      Bed {b.bed_number} (${b.daily_rate?.toFixed(0)}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reason for Transfer</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Patient stepped down from ICU to General Ward"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={!transferForm.new_bed_id} className="btn btn-primary">
                  Execute Bed Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && selectedBed && (
        <div className="modal-overlay" onClick={() => setShowDischargeModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '560px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                Discharge Patient & Free Bed {selectedBed.bed_number}
              </h3>
              <button onClick={() => setShowDischargeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDischarge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Discharging: <strong>{selectedBed.patient_name}</strong> ({selectedBed.patient_code})
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Discharge Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={dischargeForm.discharge_date}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_date: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Discharge Summary & Instructions *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  value={dischargeForm.discharge_summary}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_summary: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowDischargeModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirm Discharge & Free Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
