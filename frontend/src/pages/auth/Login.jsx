import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  Activity,
  Calendar,
  Layers,
  FlaskConical,
  Pill,
  CreditCard,
  User,
  Sparkles
} from 'lucide-react';

const ROLE_ICONS = {
  'Super Admin': Shield,
  'Hospital Admin': UserCheck,
  'Doctor': Activity,
  'Nurse': HeartPulse,
  'Receptionist': Calendar,
  'Pharmacist': Pill,
  'Laboratory Staff': FlaskConical,
  'Accountant': CreditCard,
  'Patient': User
};

export const Login = ({ onSwitchToRegister }) => {
  const { login, switchRole, demoRoles } = useAuth();
  const { showToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      showToast('Signed in successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (roleName) => {
    setSwitchingRole(roleName);
    try {
      await switchRole(roleName);
      showToast(`Welcome! Logged in as ${roleName}`, 'success');
    } catch (err) {
      showToast(`Failed to switch to ${roleName}`, 'error');
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.25) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1080px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        zIndex: 10
      }}>
        {/* Left Section: 1-Click Role Switcher Demo Deck */}
        <div style={{
          padding: '2.5rem 2rem',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
              }}>
                <HeartPulse size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Smart<span style={{ color: '#0d9488' }}>Care</span> HMS
                </h1>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enterprise Clinical Platform
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <Sparkles size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.775rem', color: '#1e40af', lineHeight: 1.4 }}>
                <strong>Viva & Demo Quick Access:</strong> Click any of the 9 pre-configured roles below to test instant role-based access control.
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.6rem'
            }}>
              {demoRoles.map((dr) => {
                const Icon = ROLE_ICONS[dr.role] || User;
                const isCurrentLoading = switchingRole === dr.role;
                return (
                  <button
                    key={dr.role}
                    type="button"
                    onClick={() => handleQuickRole(dr.role)}
                    disabled={switchingRole !== null}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.65rem 0.8rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0d9488';
                      e.currentTarget.style.backgroundColor = '#f0fdfa';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      flexShrink: 0
                    }}>
                      <Icon size={15} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dr.role}
                      </div>
                      <div style={{ fontSize: '0.675rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dr.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.725rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            SmartCare HMS • Python FastAPI + React Vite • ISO-27799 Compliant EMR Architecture
          </div>
        </div>

        {/* Right Section: Standard Credentials Login Form */}
        <div style={{
          padding: '2.5rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
              Account Sign In
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Sign in with your staff or patient credentials to access your portal.
            </p>
          </div>

          <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#ffffff'
              }}>
                <Mail size={17} color="#94a3b8" />
                <input
                  type="email"
                  placeholder="admin@smartcare.hospital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.875rem',
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#ffffff'
              }}>
                <Lock size={17} color="#94a3b8" />
                <input
                  type="password"
                  placeholder="Demo password: admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.875rem',
                    color: '#0f172a'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                Default demo password is <code>admin123</code> for all staff accounts.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.825rem',
            color: '#64748b',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '1.25rem'
          }}>
            New patient?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#0d9488',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Register for Patient Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
