import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  CheckCircle,
  AlertTriangle,
  Lock,
  Globe
} from 'lucide-react';

export const AuditLogView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [roleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(roleFilter);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.user_email && log.user_email.toLowerCase().includes(q)) ||
      (log.target_entity && log.target_entity.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return <span className="badge badge-blue">AUTH</span>;
    }
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('ALERT')) {
      return <span className="badge badge-rose">CRITICAL</span>;
    }
    if (act.includes('CREATE') || act.includes('ADMIT') || act.includes('ORDER')) {
      return <span className="badge badge-emerald">CREATE</span>;
    }
    if (act.includes('UPDATE') || act.includes('TRANSFER') || act.includes('STATUS')) {
      return <span className="badge badge-amber">UPDATE</span>;
    }
    return <span className="badge badge-purple">{action}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
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
            <ShieldCheck size={24} color="#0d9488" />
            Security Audit Trail & Compliance Ledger
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
            HIPAA-compliant immutable system access logs, administrative modifications & clinical access logs
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <Lock size={14} />
            <span>Audit Immutable Hash Active</span>
          </div>

          <button
            onClick={fetchLogs}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search action, user email, entity, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              color: '#0f172a',
              background: 'transparent'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.825rem',
              color: '#0f172a',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Hospital Admin">Hospital Admin</option>
            <option value="Doctor">Doctor</option>
            <option value="Nurse">Nurse</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Laboratory Staff">Laboratory Staff</option>
            <option value="Accountant">Accountant</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Patient">Patient</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>User / Identity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Entity</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    Loading audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={13} color="#94a3b8" />
                        <span>{log.created_at || 'Just now'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 700
                        }}>
                          {(log.user_email || 'U')[0].toUpperCase()}
                        </div>
                        <span>{log.user_email || `User #${log.user_id}`}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-slate" style={{ fontSize: '0.725rem' }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      <code style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {log.target_entity || 'N/A'}
                      </code>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#475569', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.details}>
                      {log.details || 'System operation executed successfully.'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Globe size={12} color="#94a3b8" />
                        <span>{log.ip_address || '127.0.0.1'}</span>
                      </div>
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
