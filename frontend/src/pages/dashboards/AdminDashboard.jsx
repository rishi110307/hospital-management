import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Calendar,
  BedDouble,
  Activity,
  DollarSign,
  FlaskConical,
  Pill,
  Droplet,
  AlertOctagon,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AdminDashboard = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const summary = await api.getAnalyticsSummary();
      setData(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading SmartCare Analytics & Dashboard...
      </div>
    );
  }

  const { kpis, charts } = data;

  const statCards = [
    { title: 'Total Patients', value: kpis.total_patients, icon: Users, color: '#0d9488', bg: '#ccfbf1', path: 'patients' },
    { title: "Today's Appointments", value: kpis.today_appointments, icon: Calendar, color: '#2563eb', bg: '#dbeafe', path: 'appointments' },
    { title: 'Inpatient Admissions', value: kpis.current_admissions, icon: Activity, color: '#7c3aed', bg: '#ede9fe', path: 'beds' },
    { title: 'Available Beds', value: `${kpis.available_beds} / ${kpis.total_beds}`, icon: BedDouble, color: '#059669', bg: '#d1fae5', path: 'beds' },
    { title: 'Available ICU Beds', value: `${kpis.available_icu_beds} / ${kpis.total_icu_beds}`, icon: AlertOctagon, color: '#dc2626', bg: '#fee2e2', path: 'beds' },
    { title: "Today's Revenue", value: `₹{kpis.total_revenue.toLocaleString()}`, icon: DollarSign, color: '#d97706', bg: '#fef3c7', path: 'billing' },
    { title: 'Pending Lab Tests', value: kpis.pending_labs, icon: FlaskConical, color: '#0284c7', bg: '#e0f2fe', path: 'laboratory' },
    { title: 'Pharmacy Low Stock', value: kpis.low_stock_medicines, icon: Pill, color: '#e11d48', bg: '#ffe4e6', path: 'pharmacy' },
    { title: 'Blood Bank Units', value: `${kpis.total_blood_units} Units`, icon: Droplet, color: '#be123c', bg: '#ffe4e6', path: 'blood-bank' },
    { title: 'Active Emergencies', value: kpis.active_emergencies, icon: AlertOctagon, color: '#ea580c', bg: '#ffedd5', path: 'emergency' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              System Operational
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
            Welcome back, {user?.full_name}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            SmartCare Hospital Management Center • Role: <strong style={{ color: '#38bdf8' }}>{role}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => onNavigate('emergency')}
            className="btn btn-danger btn-sm"
            style={{ boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)' }}
          >
            <AlertOctagon size={15} />
            Emergency Center
          </button>
          <button
            onClick={() => onNavigate('queue')}
            className="btn btn-primary btn-sm"
          >
            <Clock size={15} />
            Live Queue Tokens
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="card"
              onClick={() => onNavigate(card.path)}
              style={{
                padding: '1.15rem 1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={19} color={card.color} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                  {card.value}
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        {/* Patient Volume Trends */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Patient Trends & Flow</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Daily patient admissions vs appointments</p>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              <TrendingUp size={12} /> +14% this week
            </span>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.patient_trends}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="patients" name="Total Patients" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatients)" />
                <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAppts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Patients Distribution */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Department-wise Patients</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Clinical workload by department</p>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
              Active Specialties
            </span>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.department_patients}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Patient Count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue & Bed Occupancy Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        {/* Revenue Breakdown */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Hospital Revenue Distribution</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Itemized breakdown across services</p>
          </div>
          <div style={{ height: '240px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.revenue_breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {charts.revenue_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Bed Occupancy */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Ward Bed Occupancy Rates</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Occupied vs Available beds by ward</p>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bed_occupancy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="ward_name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="occupied" name="Occupied" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
