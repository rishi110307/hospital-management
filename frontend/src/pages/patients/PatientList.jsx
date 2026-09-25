import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  HeartPulse,
  Calendar,
  FileText,
  FlaskConical,
  BedDouble,
  X
} from 'lucide-react';

export const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const { showToast } = useNotification();

  // Registration form state
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    emergency_contact: '',
    address: '',
    allergies: '',
    medical_history: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [search, bloodGroup]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (bloodGroup) params.append('blood_group', bloodGroup);
      const data = await api.getPatients(params.toString());
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (id) => {
    try {
      const detail = await api.getPatientDetail(id);
      setPatientDetail(detail);
      setSelectedPatientId(id);
    } catch (err) {
      showToast('Failed to load patient records', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPatient({
        ...formData,
        age: parseInt(formData.age) || 30
      });
      showToast(`Patient registered successfully with ID: ${res.patient_code}`, 'success');
      setShowRegModal(false);
      fetchPatients();
      setFormData({
        full_name: '',
        age: '',
        gender: 'Male',
        blood_group: 'O+',
        phone: '',
        email: '',
        emergency_contact: '',
        address: '',
        allergies: '',
        medical_history: ''
      });
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Patient Management & EMR
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Digital patient registries, chronological health timeline, and clinical records
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          Register Patient
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            placeholder="Search by name, Patient Code (e.g. SC-P1001), or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Details</th>
                <th>Age / Gender</th>
                <th>Blood Group</th>
                <th>Contact Info</th>
                <th>Allergies & History</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading patient database...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No patients found matching the criteria.
                  </td>
                </tr>
              ) : (
                patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#0d9488',
                        backgroundColor: '#ccfbf1',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {p.patient_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.address || 'Address not listed'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.age} yrs</span> • {p.gender}
                    </td>
                    <td>
                      <span className="badge badge-rose" style={{ fontWeight: 700 }}>
                        {p.blood_group || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                        <Phone size={13} color="#64748b" /> {p.phone}
                      </div>
                      {p.emergency_contact && (
                        <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.15rem' }}>
                          ICE: {p.emergency_contact}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.allergies ? (
                        <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                          ⚠️ {p.allergies}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No known allergies</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewPatient(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Eye size={13} />
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail & Digital Chronological Timeline Modal */}
      {patientDetail && (
        <div className="modal-overlay" onClick={() => setPatientDetail(null)}>
          <div
            className="card animate-fade-in"
            style={{
              width: '850px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}>
                  {patientDetail.full_name[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      {patientDetail.full_name}
                    </h3>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px'
                    }}>
                      {patientDetail.patient_code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                    {patientDetail.age} yrs • {patientDetail.gender} • Blood Group: <strong style={{ color: '#f43f5e' }}>{patientDetail.blood_group}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPatientDetail(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Demographics Summary Strip */}
            <div style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: '#64748b' }}>Phone:</span> <strong>{patientDetail.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Emergency:</span> <strong>{patientDetail.emergency_contact || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Allergies:</span> <strong style={{ color: '#b45309' }}>{patientDetail.allergies || 'None'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Medical History:</span> <span>{patientDetail.medical_history || 'None'}</span>
              </div>
            </div>

            {/* Unified Chronological Digital Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
                Digital Patient Chronological Timeline
              </h4>

              {patientDetail.timeline?.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No visit or clinical history recorded yet.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '1.75rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {patientDetail.timeline?.map((evt, idx) => {
                    let dotColor = '#0d9488';
                    let icon = <Calendar size={14} color="#ffffff" />;

                    if (evt.type === 'clinical') {
                      dotColor = '#2563eb';
                      icon = <HeartPulse size={14} color="#ffffff" />;
                    } else if (evt.type === 'lab') {
                      dotColor = '#7c3aed';
                      icon = <FlaskConical size={14} color="#ffffff" />;
                    } else if (evt.type === 'admission') {
                      dotColor = '#ea580c';
                      icon = <BedDouble size={14} color="#ffffff" />;
                    }

                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Timeline Node Bullet */}
                        <div style={{
                          position: 'absolute',
                          left: '-2.45rem',
                          top: '2px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 0 3px #ffffff'
                        }}>
                          {icon}
                        </div>

                        {/* Event Card */}
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                              {evt.title}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                              {evt.date}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem' }}>
                            Doctor: <strong>{evt.doctor}</strong>
                          </div>
                          <div style={{ fontSize: '0.775rem', color: '#334155', marginTop: '0.2rem' }}>
                            {evt.details}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showRegModal && (
        <div className="modal-overlay" onClick={() => setShowRegModal(false)}>
          <div
            className="card animate-fade-in"
            style={{
              width: '650px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Register New Patient</h3>
              <button onClick={() => setShowRegModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Johnathan Doe"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="35"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Emergency Contact (ICE)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Name & Contact Number"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Residential Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Postal Code"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Known Allergies (if any)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Peanuts, Sulfa"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Past Medical History</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  placeholder="e.g. Hypertension, previous surgeries, chronic illnesses"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Register & Generate ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
