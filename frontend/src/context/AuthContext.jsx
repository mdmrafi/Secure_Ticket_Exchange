import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.service.js';

const AuthContext = createContext(null);

const SEEDED_CREDENTIALS = {
  user: { email: 'user@safepass.com', password: 'Password123!' },
  unverified: { email: 'unverified@safepass.com', password: 'Password123!' },
  admin: { email: 'admin@safepass.com', password: 'Password123!' },
};

const FALLBACK_PROFILES = {
  guest: null,
  user: {
    _id: '6abedae814ee2e2ed024a5bd',
    name: 'Tanvir Hossain',
    email: 'user@safepass.com',
    phone: '+880 1711-234567',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    trustScore: 96,
  },
  unverified: {
    _id: '6abedae814ee2e2ed024a5bf',
    name: 'Rashidul Karim',
    email: 'unverified@safepass.com',
    phone: '+880 1912-345678',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'NOT_STARTED',
    trustScore: 75,
  },
  admin: {
    _id: '6abedae814ee2e2ed024a5bb',
    name: 'Chief Security Officer',
    email: 'admin@safepass.com',
    phone: '+880 1700-000001',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    trustScore: 100,
  },
};

export const AuthProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('demo_role') || 'user';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return FALLBACK_PROFILES[currentRole];
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync role switch with real backend authentication
  const switchRole = async (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('demo_role', newRole);

    if (newRole === 'guest') {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      return;
    }

    const creds = SEEDED_CREDENTIALS[newRole];
    if (creds) {
      try {
        setIsLoading(true);
        const res = await apiService.login(creds);
        if (res.data?.tokens?.accessToken) {
          const accessToken = res.data.tokens.accessToken;
          const authUser = res.data.user;
          // In backend, check KYC status
          authUser.kycStatus = newRole === 'unverified' ? 'NOT_STARTED' : 'VERIFIED';
          setToken(accessToken);
          setUser(authUser);
          localStorage.setItem('token', accessToken);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          return;
        }
      } catch (err) {
        console.warn('Backend login fallback used for role:', newRole, err.message);
      } finally {
        setIsLoading(false);
      }
    }

    // Fallback if backend was temporarily unreachable
    const profile = FALLBACK_PROFILES[newRole];
    setUser(profile);
    setToken(profile ? `token_${newRole}` : null);
    if (profile) {
      localStorage.setItem('auth_user', JSON.stringify(profile));
    }
  };

  // Real backend login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await apiService.login({ email, password });
      if (res.data?.tokens?.accessToken) {
        const accessToken = res.data.tokens.accessToken;
        const authUser = res.data.user;
        setToken(accessToken);
        setUser(authUser);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        setCurrentRole(authUser.role === 'ADMIN' ? 'admin' : 'user');
        return { success: true, user: authUser };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Real backend register function
  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await apiService.register(formData);
      if (res.data?.tokens?.accessToken) {
        const accessToken = res.data.tokens.accessToken;
        const authUser = res.data.user;
        setToken(accessToken);
        setUser(authUser);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        setCurrentRole('unverified');
        return { success: true, user: authUser };
      }
      return { success: true, user: res.data?.user };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    switchRole('guest');
  };

  // Try to authenticate initial session against backend on load if token is present
  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    if (!existingToken && currentRole !== 'guest') {
      switchRole(currentRole);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentRole,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isKycVerified: user?.kycStatus === 'VERIFIED',
        isLoading,
        switchRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
