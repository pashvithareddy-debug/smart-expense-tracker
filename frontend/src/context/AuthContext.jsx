import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getToken,
  setToken,
  removeToken,
  getUserCache,
  setUserCache,
  authAPI,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserCache());
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authAPI.getMe();
      setUser(me);
      setUserCache(me);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleExpired = () => {
      logout();
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    setAuthToken(data.access_token);
    setUser(data.user);
    setUserCache(data.user);
    return data;
  };

  const register = async (name, email, password, currency = '$') => {
    const data = await authAPI.register(name, email, password, currency);
    setToken(data.access_token);
    setAuthToken(data.access_token);
    setUser(data.user);
    setUserCache(data.user);
    return data;
  };

  const logout = () => {
    removeToken();
    setUserCache(null);
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
