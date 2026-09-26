import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  UserCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase,
  DollarSign
} from 'lucide-react';

export const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    fetchData();
  }, [search, selectedDept]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('specialization', search);
      if (selectedDept) params.append('department_id', selectedDept);
      const [docs, depts] = await Promise.all([
        api.getDoctors(params.toString()),
        api.getDepartments()
      ]);
      setDoctors(docs);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (docId, currentStatus) => {
    const nextStatus = currentStatus === 'Available' ? 'On Leave' : 'Available';
    try {
      await api.updateDoctorStatus(docId, nextStatus);
      showToast(`Doctor status updated to ${nextStatus}`, 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update doctor status', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Doctor & Department Directory
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Board-certified physicians, clinical schedules, consultation fees, and real-time duty status
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading doctors...</div>
        ) : (
          doctors.map(d => (
            <div
              key={d.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <img
                      src={d.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256"}
                      alt={d.full_name}
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {d.full_name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d9488' }}>
                        {d.specialization}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {d.department_name} • {d.room_number || 'Room TBD'}
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${d.available_status === 'Available' ? 'emerald' : 'amber'}`}>
                    {d.available_status}
                  </span>
                </div>

                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={14} color="#64748b" />
                    <span>{d.qualification} ({d.experience_years} yrs exp)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="#64748b" />
                    <span>Schedule: {d.schedule_days}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="#64748b" />
                    <span>Slots: {d.time_slots}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={14} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#059669' }}>Fee: ₹{d.consultation_fee?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Floor: {d.department_floor || 'Main Wing'}
                </span>
                <button
                  onClick={() => handleToggleStatus(d.id, d.available_status)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {d.available_status === 'Available' ? 'Set On Leave' : 'Set Available'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
