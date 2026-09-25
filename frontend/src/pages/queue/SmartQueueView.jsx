import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Layers,
  Clock,
  UserCheck,
  Volume2,
  CheckCircle,
  SkipForward,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const SmartQueueView = () => {
  const { user, role } = useAuth();
  const [board, setBoard] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 5000); // 5s auto-polling
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  const loadDoctors = async () => {
    try {
      const docs = await api.getDoctors();
      setDoctors(docs);
      if (docs.length > 0) setSelectedDoctorId(docs[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBoard = async () => {
    try {
      const data = await api.getQueueBoard(`doctor_id=${selectedDoctorId}`);
      setBoard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await api.callNextPatient(selectedDoctorId);
      if (res.token) {
        showToast(`Now Calling: Token ${res.token.token_code}`, 'success');
      } else {
        showToast(res.message, 'info');
      }
      fetchBoard();
    } catch (err) {
      showToast('Failed to call next token', 'error');
    }
  };

  const handleUpdateStatus = async (tokenId, status) => {
    try {
      await api.updateTokenStatus(tokenId, status);
      showToast(`Token status updated to ${status}`, 'success');
      fetchBoard();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  if (loading || !board) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading Smart Queue Board...</div>;
  }

  const currentlyServing = board.currently_serving;
  const waitingQueue = board.waiting_queue || [];
  const selectedDocObj = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Doctor Selection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Smart Queue & Token Management Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Live hospital token queue display with dynamic wait-time calculation and doctor call controls
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Counter / Doctor:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.full_name} ({d.specialization} - {d.room_number || 'Room 204'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prominent Live Token Board Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Counter 1: Currently Serving */}
        <div className="card" style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(13, 148, 136, 0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, fontWeight: 700 }}>
                Currently Serving Counter
              </span>
              <span className="badge badge-emerald" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                <Volume2 size={12} /> Active Call
              </span>
            </div>

            <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4.5rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                {currentlyServing ? currentlyServing.token_code : '--'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                {currentlyServing ? currentlyServing.patient_name : 'No Patient in Counter'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {currentlyServing ? `ID: ${currentlyServing.patient_code} • Consultation in Progress` : 'Click "Call Next Patient" to advance queue'}
              </div>
            </div>
          </div>

          {/* Doctor Call Next Action Bar */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={handleCallNext}
              className="btn"
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: '#0f766e',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              <Volume2 size={16} />
              Call Next Patient
            </button>
            {currentlyServing && (
              <button
                onClick={() => handleUpdateStatus(currentlyServing.id, 'Completed')}
                className="btn btn-secondary"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
                title="Mark Current Complete"
              >
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Counter 2: Next In Line & Estimated Waiting Time */}
        <div className="card" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
                Next Token in Queue
              </span>
              <span className="badge badge-blue">
                Queue Status: Active
              </span>
            </div>

            <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4.5rem',
                fontWeight: 900,
                color: '#2563eb',
                lineHeight: 1
              }}>
                {waitingQueue.length > 0 ? waitingQueue[0].token_code : '--'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
                {waitingQueue.length > 0 ? waitingQueue[0].patient_name : 'No waiting patients'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {waitingQueue.length > 0 ? `ID: ${waitingQueue[0].patient_code} • Prepared for Consultation` : 'Waiting queue is currently empty'}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} color="#2563eb" />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>Estimated Waiting Time</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                  ~{waitingQueue.length * 15} Minutes
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Queue Depth</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {waitingQueue.length} Patient(s)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Queue List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Waiting Queue Roster</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Assigned doctor: <strong>{selectedDocObj?.full_name}</strong> ({selectedDocObj?.room_number || 'Room 204'})
            </p>
          </div>
          <button onClick={fetchBoard} className="btn btn-secondary btn-sm">
            <RotateCcw size={13} /> Refresh Queue
          </button>
        </div>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Queue Pos</th>
                <th>Token Code</th>
                <th>Patient Name</th>
                <th>Est. Wait Time</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitingQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No patients currently waiting in this doctor's queue.
                  </td>
                </tr>
              ) : (
                waitingQueue.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        backgroundColor: '#f0fdfa',
                        color: '#0d9488',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {item.token_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.patient_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {item.patient_code}</div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#334155' }}>
                        <Clock size={13} color="#2563eb" /> ~{item.estimated_wait_minutes} mins
                      </span>
                    </td>
                    <td>{item.department_name}</td>
                    <td>
                      <span className="badge badge-amber">Waiting</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'Calling')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                      >
                        <Volume2 size={12} /> Call
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
