import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartcare_token'));
  const [loading, setLoading] = useState(true);
  const [demoRoles, setDemoRoles] = useState([]);

  useEffect(() => {
    // Load demo roles list
    api.getDemoRoles().then(roles => setDemoRoles(roles)).catch(console.error);

    // Verify current user if token exists
    if (token) {
      api.getMe()
        .then(res => {
          setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('smartcare_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('smartcare_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const switchRole = async (roleName) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(roleName);
      localStorage.setItem('smartcare_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    const res = await api.register(data);
    localStorage.setItem('smartcare_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('smartcare_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      demoRoles,
      login,
      switchRole,
      register,
      logout,
      isAuthenticated: !!user,
      role: user?.role
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
