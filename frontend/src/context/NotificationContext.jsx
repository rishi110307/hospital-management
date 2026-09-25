import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      // ignore
    }
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('smartcare_token')) {
      refreshNotifications();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      toasts,
      showToast,
      notifications,
      unreadCount,
      refreshNotifications,
      markRead
    }}>
      {children}

      {/* Floating Toast Portal */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg = '#ffffff';
          let border = '#e2e8f0';
          let icon = <Info size={18} color="#2563eb" />;

          if (toast.type === 'success') {
            border = '#a7f3d0';
            icon = <CheckCircle2 size={18} color="#059669" />;
          } else if (toast.type === 'error') {
            border = '#fecdd3';
            icon = <AlertCircle size={18} color="#e11d48" />;
          } else if (toast.type === 'warning') {
            border = '#fde68a';
            icon = <AlertTriangle size={18} color="#d97706" />;
          }

          return (
            <div
              key={toast.id}
              className="card animate-fade-in"
              style={{
                pointerEvents: 'auto',
                padding: '0.75rem 1rem',
                border: `1px solid ${border}`,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {icon}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
