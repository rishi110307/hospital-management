import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  Shield,
  Activity,
  Layers,
  X,
  Check
} from 'lucide-react';

export const Header = ({ onOpenResourceFinder, onOpenAISummarizer }) => {
  const { user, role, switchRole, demoRoles } = useAuth();
  const { notifications, unreadCount, markRead } = useNotification();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  return (
    <header style={{
      height: '68px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      {/* Search / Resource Finder Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '420px' }}>
        <button
          onClick={onOpenResourceFinder}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            width: '100%',
            padding: '0.55rem 0.95rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            color: '#64748b',
            fontSize: '0.825rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Search size={16} color="#94a3b8" />
          <span style={{ flex: 1 }}>Search ICU beds, doctors, blood, rooms...</span>
          <kbd style={{
            fontSize: '0.68rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '0.1rem 0.35rem',
            color: '#475569',
            fontFamily: 'var(--font-mono)'
          }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        {/* AI Medical Summarizer Quick Launcher */}
        <button
          onClick={onOpenAISummarizer}
          className="btn btn-secondary"
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)',
            borderColor: '#99f6e4',
            color: '#0f766e',
            fontSize: '0.8rem',
            padding: '0.45rem 0.85rem'
          }}
        >
          <Sparkles size={15} color="#0d9488" />
          <span>AI Report Summarizer</span>
        </button>

        {/* 1-Click Demo Role Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowNotifDropdown(false);
            }}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f1f5f9',
              borderColor: '#cbd5e1',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem'
            }}
          >
            <Shield size={14} color="#2563eb" />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              Switch Role: <strong style={{ color: '#0d9488' }}>{role}</strong>
            </span>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {showRoleDropdown && (
            <div
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '290px',
                zIndex: 60,
                padding: '0.5rem',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ padding: '0.5rem 0.6rem 0.4rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Quick Demo Switcher
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Instantly switch view without relogging
                </div>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {demoRoles.map(dr => (
                  <button
                    key={dr.role}
                    onClick={() => {
                      switchRole(dr.role);
                      setShowRoleDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: role === dr.role ? '#f0fdfa' : 'transparent',
                      color: role === dr.role ? '#0f766e' : '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (role !== dr.role) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (role !== dr.role) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: role === dr.role ? 700 : 500 }}>
                        {dr.role}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {dr.badge}
                      </div>
                    </div>
                    {role === dr.role && <Check size={14} color="#0d9488" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowRoleDropdown(false);
            }}
            className="btn-icon"
            style={{ position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                zIndex: 60,
                padding: '0.75rem',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Hospital Alerts ({notifications.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600 }}>
                  Real-time
                </span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto', marginTop: '0.4rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                    No alerts right now
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        padding: '0.55rem 0.5rem',
                        borderBottom: '1px solid #f8fafc',
                        cursor: 'pointer',
                        backgroundColor: n.is_read ? 'transparent' : '#f0fdfa',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 500 : 700, color: '#1e293b' }}>
                          {n.title}
                        </span>
                        <span className={`badge badge-${n.type === 'urgent' ? 'rose' : n.type === 'warning' ? 'amber' : 'blue'}`} style={{ fontSize: '0.62rem' }}>
                          {n.type}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.735rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
