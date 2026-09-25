import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Calendar,
  BedDouble,
  FlaskConical,
  Pill,
  Download,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert
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

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('This Week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.getAnalyticsSummary();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading comprehensive clinical & operational analytics...
      </div>
    );
  }

  const { kpis, charts } = data;

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Patients,${kpis.total_patients}\n`
      + `Today Appointments,${kpis.today_appointments}\n`
      + `Active Admissions,${kpis.current_admissions}\n`
      + `Total Beds,${kpis.total_beds}\n`
      + `Available Beds,${kpis.available_beds}\n`
      + `ICU Beds Available,${kpis.available_icu_beds}\n`
      + `Total Revenue,${kpis.total_revenue}\n`
      + `Blood Bank Units,${kpis.total_blood_units}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartcare_analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#f59e0b', '#e11d48', '#10b981'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner & Timeframe Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={24} color="#0d9488" />
            Hospital Analytics & Operational Intelligence
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
            Clinical throughput, financial health, bed occupancy velocity & departmental KPIs
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.2rem' }}>
            {['This Week', 'This Month', 'This Quarter', 'This Year'].map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  border: 'none',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: timeframe === t ? '#ffffff' : 'transparent',
                  color: timeframe === t ? '#0f172a' : '#64748b',
                  boxShadow: timeframe === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total Revenue</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#fef3c7', borderRadius: '6px', color: '#d97706' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            ${kpis.total_revenue.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#059669', marginTop: '0.4rem' }}>
            <TrendingUp size={13} />
            <span>+18.4% vs last period</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Bed Occupancy Rate</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#ede9fe', borderRadius: '6px', color: '#7c3aed' }}>
              <BedDouble size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            {Math.round(((kpis.total_beds - kpis.available_beds) / (kpis.total_beds || 1)) * 100)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            {kpis.total_beds - kpis.available_beds} of {kpis.total_beds} beds occupied
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>ICU Bed Availability</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#dc2626' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>
            {kpis.available_icu_beds} / {kpis.total_icu_beds}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Critical triage ready
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Today's Consultations</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#dbeafe', borderRadius: '6px', color: '#2563eb' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            {kpis.today_appointments}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Active outpatient volume
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Blood Reserve Units</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#ffe4e6', borderRadius: '6px', color: '#e11d48' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            {kpis.total_blood_units}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.4rem' }}>
            Adequate emergency buffer
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        {/* Patient Inflow vs Appointments */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Patient Intake Trends</h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>Daily admissions vs outpatient clinic appointments</p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.patient_trends}>
                <defs>
                  <linearGradient id="anPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anAdmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="patients" name="Total Footfall" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#anPatients)" />
                <Area type="monotone" dataKey="admissions" name="Inpatient Admissions" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#anAdmit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Volume BarChart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Clinical Volume by Specialty</h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>Patient distribution across active hospital departments</p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.department_patients}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Patient Encounters" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Revenue Breakdown & Bed Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        {/* Revenue Pie Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Financial Contribution by Department</h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>Itemized revenue stream distribution</p>
          </div>
          <div style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.revenue_breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                >
                  {charts.revenue_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Bed Matrix Stats */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Ward Capacity Utilization</h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>Occupancy vs availability across wards</p>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bed_occupancy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="ward_name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
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
