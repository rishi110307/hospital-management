import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  Droplet,
  Plus,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Send,
  X
} from 'lucide-react';

export const BloodBankView = () => {
  const [inventory, setInventory] = useState([]);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'donors', 'requests'

  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const { showToast } = useNotification();

  // Donor form
  const [donorForm, setDonorForm] = useState({
    name: '',
    blood_group: 'O+',
    phone: '',
    age: 28,
    units_donated: 1
  });

  // Issue form
  const [issueForm, setIssueForm] = useState({
    blood_group: 'O+',
    units: 1,
    requested_by: 'Dr. Alexander Wright (ER)',
    priority: 'Emergency'
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [inv, don, reqs] = await Promise.all([
        api.getBloodInventory(),
        api.getBloodDonors(),
        api.getBloodRequests()
      ]);
      setInventory(inv);
      setDonors(don);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    try {
      await api.addBloodDonor(donorForm);
      showToast(`Donor registered! ${donorForm.units_donated} unit(s) of ${donorForm.blood_group} added to stock`, 'success');
      setShowDonorModal(false);
      fetchAll();
    } catch (err) {
      showToast('Failed to register donor', 'error');
    }
  };

  const handleIssueBlood = async (e) => {
    e.preventDefault();
    try {
      await api.issueBlood(issueForm);
      showToast(`Issued ${issueForm.units} unit(s) of ${issueForm.blood_group} blood successfully`, 'success');
      setShowIssueModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to issue blood', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#be123c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Droplet size={24} /> Central Blood Bank & Donor Registry
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Live blood group stock meters, emergency transfusion requests, and voluntary donor management
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                border: 'none',
                background: activeTab === 'inventory' ? '#ffffff' : 'transparent',
                color: activeTab === 'inventory' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Stock Meters
            </button>
            <button
              onClick={() => setActiveTab('donors')}
              style={{
                border: 'none',
                background: activeTab === 'donors' ? '#ffffff' : 'transparent',
                color: activeTab === 'donors' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Donors ({donors.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                border: 'none',
                background: activeTab === 'requests' ? '#ffffff' : 'transparent',
                color: activeTab === 'requests' ? '#0f172a' : '#64748b',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Requests ({requests.length})
            </button>
          </div>

          <button
            onClick={() => setShowDonorModal(true)}
            className="btn btn-secondary"
          >
            <Heart size={15} color="#e11d48" /> Register Donor
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn btn-primary"
            style={{ backgroundColor: '#be123c', borderColor: '#be123c' }}
          >
            <Droplet size={15} /> Issue Units
          </button>
        </div>
      </div>

      {/* TAB 1: BLOOD INVENTORY METERS */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {inventory.map(bg => {
            const isLow = bg.units_available < bg.min_units;
            const percentage = Math.min(100, Math.round((bg.units_available / 30) * 100));

            return (
              <div
                key={bg.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${isLow ? '#ef4444' : '#059669'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isLow ? '#ffe4e6' : '#ecfdf5',
                      color: isLow ? '#e11d48' : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.2rem',
                      fontWeight: 900
                    }}>
                      {bg.blood_group}
                    </div>

                    <span className={`badge badge-${isLow ? 'rose' : 'emerald'}`}>
                      {isLow ? 'Critical Low' : 'Adequate'}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {bg.units_available}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginLeft: '0.35rem' }}>
                        Units Available
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                      Safety Buffer Threshold: {bg.min_units} Units
                    </div>
                  </div>

                  {/* Meter bar */}
                  <div style={{
                    marginTop: '0.85rem',
                    width: '100%',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: '#f1f5f9',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: isLow ? '#ef4444' : '#10b981',
                      borderRadius: '999px'
                    }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Basement 1 • Cold Vault</span>
                  <button
                    onClick={() => {
                      setIssueForm(f => ({ ...f, blood_group: bg.blood_group }));
                      setShowIssueModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#be123c', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Quick Issue →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DONORS TABLE */}
      {activeTab === 'donors' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Blood Group</th>
                  <th>Contact Number</th>
                  <th>Age</th>
                  <th>Last Donation</th>
                  <th>Units Donated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-rose" style={{ fontWeight: 800 }}>
                        {d.blood_group}
                      </span>
                    </td>
                    <td>{d.phone}</td>
                    <td>{d.age} yrs</td>
                    <td>{d.last_donated || 'First time'}</td>
                    <td>
                      <strong>{d.units_donated} Unit(s)</strong>
                    </td>
                    <td>
                      <span className="badge badge-emerald">Eligible</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REQUESTS TABLE */}
      {activeTab === 'requests' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Blood Group</th>
                  <th>Units Needed</th>
                  <th>Priority</th>
                  <th>Requested By</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        BLD-{r.id.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-rose" style={{ fontWeight: 800 }}>
                        {r.blood_group}
                      </span>
                    </td>
                    <td>
                      <strong>{r.units_needed} Unit(s)</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${r.priority === 'Emergency' ? 'rose' : 'blue'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td>{r.requested_by}</td>
                    <td style={{ fontSize: '0.8rem' }}>{r.created_at?.split('T')[0] || 'Recent'}</td>
                    <td>
                      <span className="badge badge-emerald">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Donor Modal */}
      {showDonorModal && (
        <div className="modal-overlay" onClick={() => setShowDonorModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '540px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Register Voluntary Blood Donor</h3>
              <button onClick={() => setShowDonorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDonor} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Donor Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Marcus Aurelius"
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Blood Group *</label>
                  <select
                    className="form-select"
                    value={donorForm.blood_group}
                    onChange={(e) => setDonorForm({ ...donorForm, blood_group: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    required
                    className="form-input"
                    value={donorForm.age}
                    onChange={(e) => setDonorForm({ ...donorForm, age: parseInt(e.target.value) || 25 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="+1-555-0100"
                    value={donorForm.phone}
                    onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Units Donated</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    className="form-input"
                    value={donorForm.units_donated}
                    onChange={(e) => setDonorForm({ ...donorForm, units_donated: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowDonorModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#be123c', borderColor: '#be123c' }}>
                  Register Donor & Add Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Blood Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div
            className="card animate-fade-in"
            style={{ width: '540px', maxWidth: '95vw', backgroundColor: '#ffffff', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Issue Blood Units for Transfusion</h3>
              <button onClick={() => setShowIssueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueBlood} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Blood Group *</label>
                  <select
                    className="form-select"
                    value={issueForm.blood_group}
                    onChange={(e) => setIssueForm({ ...issueForm, blood_group: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Units to Issue *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    className="form-input"
                    value={issueForm.units}
                    onChange={(e) => setIssueForm({ ...issueForm, units: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Requesting Physician / Ward *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Dr. Marcus Brody (CCU)"
                    value={issueForm.requested_by}
                    onChange={(e) => setIssueForm({ ...issueForm, requested_by: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={issueForm.priority}
                    onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#be123c', borderColor: '#be123c' }}>
                  Confirm Transfusion Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
