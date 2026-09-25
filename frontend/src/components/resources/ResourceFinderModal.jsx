import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, X, BedDouble, UserCheck, Droplet, FlaskConical, ArrowRight } from 'lucide-react';

export const ResourceFinderModal = ({ isOpen, onClose, onSelectAction }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchResources();
    }
  }, [isOpen, query]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await api.searchResources(query);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredResults = results.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Beds' && r.category.includes('Bed')) return true;
    if (filter === 'Doctors' && r.category.includes('Physician')) return true;
    if (filter === 'Blood' && r.category.includes('Blood')) return true;
    if (filter === 'Labs' && r.category.includes('Laboratory')) return true;
    return false;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-fade-in"
        style={{
          width: '680px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <Search size={20} color="#0d9488" />
          <input
            type="text"
            placeholder="Search available ICU beds, doctors on duty, blood units, labs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: '#0f172a',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.6rem 1.25rem',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#ffffff'
        }}>
          {['All', 'Beds', 'Doctors', 'Blood', 'Labs'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filter === f ? '#0d9488' : '#f1f5f9',
                color: filter === f ? '#ffffff' : '#64748b'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Searching hospital resources...</div>
          ) : filteredResults.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
              No matching hospital resources found for "{query}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredResults.map((item, idx) => {
                let icon = <BedDouble size={18} color="#0d9488" />;
                if (item.type === 'Doctor') icon = <UserCheck size={18} color="#2563eb" />;
                if (item.type === 'Blood') icon = <Droplet size={18} color="#e11d48" />;
                if (item.type === 'Lab') icon = <FlaskConical size={18} color="#7c3aed" />;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#f1f5f9';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e2e8f0'
                      }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`badge badge-${item.badge_color}`} style={{ fontSize: '0.7rem' }}>
                        {item.status}
                      </span>
                      <button
                        onClick={() => {
                          if (onSelectAction) onSelectAction(item);
                          onClose();
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        {item.action}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.75rem', color: '#64748b' }}>
          💡 Pro-tip: Press <kbd style={{ fontFamily: 'var(--font-mono)', padding: '0.1rem 0.3rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px' }}>Esc</kbd> to close. Type "ICU", "Cardiology", or "O-" for fast drilldown.
        </div>
      </div>
    </div>
  );
};
