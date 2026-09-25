import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  HeartPulse,
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    age: 28,
    gender: 'Male',
    blood_group: 'O+',
    emergency_contact: '',
    address: '',
    allergies: 'None',
    medical_history: 'No major chronic condition',
    role: 'Patient'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password || !formData.phone) {
      showToast('Please fill in all mandatory fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await register(formData);
      showToast(`Registration complete! Your Patient ID is ${res.patient_code || 'generated'}`, 'success');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        zIndex: 10,
        padding: '2.5rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <HeartPulse size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Patient Portal Registration
              </h1>
              <p style={{ fontSize: '0.775rem', color: '#64748b' }}>
                Create your digital SmartCare patient account for online appointments & records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={15} />
            Back to Sign In
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                <User size={16} color="#94a3b8" />
                <input
                  type="text"
                  name="full_name"
                  placeholder="e.g. Jonathan Edwards"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Email Address *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                <Mail size={16} color="#94a3b8" />
                <input
                  type="email"
                  name="email"
                  placeholder="jonathan@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Password *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                <Lock size={16} color="#94a3b8" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Contact Phone *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                <Phone size={16} color="#94a3b8" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: '#ffffff' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: '#ffffff' }}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Emergency Contact (Name & Phone)
              </label>
              <input
                type="text"
                name="emergency_contact"
                placeholder="e.g. Mary Edwards (Wife) +1 555-9876"
                value={formData.emergency_contact}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Known Allergies
              </label>
              <input
                type="text"
                name="allergies"
                placeholder="Penicillin, Sulfa drugs, Peanuts, None..."
                value={formData.allergies}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Medical History & Pre-existing Conditions
              </label>
              <input
                type="text"
                name="medical_history"
                placeholder="Hypertension, Asthma, Diabetes, or None"
                value={formData.medical_history}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            By registering, an official SmartCare Patient Medical Record ID (SC-PXXXX) will be automatically generated and linked to your digital health timeline.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
            >
              <span>{loading ? 'Creating Digital Record...' : 'Complete Patient Registration'}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
