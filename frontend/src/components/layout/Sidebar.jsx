import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  FlaskConical,
  Pill,
  BedDouble,
  AlertOctagon,
  Droplet,
  CreditCard,
  ShieldCheck,
  BarChart3,
  LogOut,
  Sparkles,
  HeartPulse
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user, role, logout } = useAuth();

  // Full module list with role permissions
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
    { id: 'patients', label: 'Patient Management', icon: Users, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'] },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck, roles: ['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Patient'] },
    { id: 'queue', label: 'Smart Token Queue', icon: Layers, roles: ['*'] },
    { id: 'emr', label: 'Medical Records (EMR)', icon: FileText, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Patient'] },
    { id: 'laboratory', label: 'Laboratory & Diagnostics', icon: FlaskConical, roles: ['Super Admin', 'Hospital Admin', 'Laboratory Staff', 'Doctor', 'Patient'] },
    { id: 'pharmacy', label: 'Pharmacy & Expiry', icon: Pill, roles: ['Super Admin', 'Hospital Admin', 'Pharmacist', 'Doctor'] },
    { id: 'beds', label: 'Bed & Room Matrix', icon: BedDouble, roles: ['Super Admin', 'Hospital Admin', 'Nurse', 'Receptionist', 'Doctor'] },
    { id: 'emergency', label: 'Emergency & Triage', icon: AlertOctagon, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse'] },
    { id: 'blood-bank', label: 'Blood Bank Inventory', icon: Droplet, roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Laboratory Staff'] },
    { id: 'billing', label: 'Billing & Insurance', icon: CreditCard, roles: ['Super Admin', 'Hospital Admin', 'Accountant', 'Receptionist', 'Patient'] },
    { id: 'analytics', label: 'Hospital Analytics', icon: BarChart3, roles: ['Super Admin', 'Hospital Admin', 'Accountant'] },
    { id: 'audit', label: 'Audit Logs & Security', icon: ShieldCheck, roles: ['Super Admin', 'Hospital Admin'] },
  ];

  // Filter items visible to current role
  const visibleNav = navItems.filter(item => {
    if (role === 'Super Admin') return true;
    return item.roles.includes('*') || item.roles.includes(role);
  });

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      borderRight: '1px solid #1e293b',
      zIndex: 40
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.25rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(13, 148, 136, 0.4)'
        }}>
          <HeartPulse size={22} />
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Smart<span style={{ color: '#14b8a6' }}>Care</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Hospital Platform
          </div>
        </div>
      </div>

      {/* Current Active Role Pill */}
      <div style={{
        margin: '1rem 1rem 0.5rem 1rem',
        padding: '0.65rem 0.85rem',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Role
          </div>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#38bdf8' }}>
            {role || 'Guest'}
          </div>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
          Live
        </span>
      </div>

      {/* Navigation List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 0.75rem'
      }}>
        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, padding: '0.4rem 0.6rem 0.5rem' }}>
          Modules
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {visibleNav.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(13, 148, 136, 0.2)' : 'transparent',
                  color: isActive ? '#2dd4bf' : '#94a3b8',
                  border: isActive ? '1px solid rgba(45, 212, 191, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#2dd4bf' : '#64748b'} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {item.id === 'queue' && (
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: '#0369a1',
                    color: '#e0f2fe',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}>
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div style={{
        padding: '0.85rem 1rem',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#090d16'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          <img
            src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"}
            alt="avatar"
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.full_name?.split(' ')[0] || 'User'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};
