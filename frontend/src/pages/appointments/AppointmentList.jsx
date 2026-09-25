import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Play,
  Layers,
  X
} from 'lucide-react';

export const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    time_slot: '09:30 AM',
    reason: '',
    symptoms: ''
  });

  const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
  ];

  useEffect(() => {
    fetchAppointments();
    loadInitialDropdowns();
  }, [statusFilter]);

  const loadInitialDropdowns = async () => {
    try {
      const [docs, pats] = await Promise.all([
        api.getDoctors(),
        api.getPatients()
      ]);
      setDoctors(docs);
      setPatients(pats);
      if (docs.length > 0) setForm(f => ({ ...f, doctor_id: docs[0].id }));
      if (pats.length > 0) setForm(f => ({ ...f, patient_id: pats[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const data = await api.getAppointments(params.toString());
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createAppointment({
        ...form,
        patient_id: parseInt(form.patient_id),
        doctor_id: parseInt(form.doctor_id)
      });
      showToast(`Appointment booked! Token assigned: ${res.token_number} (~${res.estimated_wait_minutes} min wait)`, 'success');
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      showToast(err.message || 'Booking failed', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      showToast(`Appointment marked as ${status}`, 'success');
      fetchAppointments();
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Smart Appointment Scheduling
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Conflict-free slot booking with auto-issued token queue integration
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          Book Appointment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Appointment Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In-Consultation">In-Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{appointments.length}</strong> scheduled appointments
        </span>
      </div>

      {/* Appointments Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Patient Details</th>
                <th>Doctor & Dept</th>
                <th>Date & Slot</th>
                <th>Reason / Symptoms</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map(a => {
                  let badge = 'badge-blue';
                  if (a.status === 'In-Consultation') badge = 'badge-amber';
                  if (a.status === 'Completed') badge = 'badge-emerald';
                  if (a.status === 'Cancelled') badge = 'badge-rose';

                  return (
                    <tr key={a.id}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          color: '#0f172a'
                        }}>
                          {a.token_number || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.patient_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {a.patient_code} • {a.patient_phone}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{a.doctor_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0d9488' }}>
                          {a.specialization} ({a.room_number || 'Room 101'})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.appointment_date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.time_slot}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                          {a.reason || 'General Consultation'}
                        </div>
                        {a.symptoms && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Symp: {a.symptoms}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badge}`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {a.status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'In-Consultation')}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                              title="Start Consultation"
                            >
                              <Play size={12} /> Consult
                            </button>
                          )}
                          {a.status === 'In-Consultation' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Completed')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem', color: '#059669', borderColor: '#a7f3d0' }}
                              title="Mark Complete"
                            >
                              <CheckCircle size={12} /> Done
                            </button>
                          )}
                          {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Cancelled')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem', color: '#dc2626' }}
                              title="Cancel"
                            >
                              <XCircle size={12} />
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

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card animate-fade-in"
            style={{
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Schedule New Appointment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-select"
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Doctor & Specialty *</label>
                <select
                  required
                  className="form-select"
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} – {d.specialization} (${d.consultation_fee?.toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Available Time Slot *</label>
                  <select
                    className="form-select"
                    value={form.time_slot}
                    onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
                  >
                    {TIME_SLOTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reason for Visit</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cardiac checkup, follow-up, general review"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reported Symptoms</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Mild chest discomfort, shortness of breath"
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Confirm & Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
