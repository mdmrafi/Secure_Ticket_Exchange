import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const MOCK_PROFILES = {
  guest: null,
  user: {
    _id: 'usr_verified_7721',
    name: 'Rahim Chowdhury',
    email: 'rahim.chowdhury@example.com',
    phone: '+880 1712-345678',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    kycLevel: 'LEVEL_2',
    accountAge: '1 year, 4 months',
    completedTransactions: 19,
    joinedDate: 'June 2025',
    verifiedAt: '14 July 2025',
  },
  unverified: {
    _id: 'usr_pending_8812',
    name: 'Tanvir Hossain',
    email: 'tanvir.hossain@example.com',
    phone: '+880 1819-987654',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'NOT_STARTED',
    accountAge: '2 days',
    completedTransactions: 0,
    joinedDate: 'September 2026',
  },
  admin: {
    _id: 'adm_security_001',
    name: 'Sarah Rahman',
    email: 'sarah.moderator@exchange.internal',
    phone: '+880 1911-000111',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    joinedDate: 'January 2025',
  },
};

export const AuthProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('demo_role') || 'user';
  });

  const [user, setUser] = useState(() => MOCK_PROFILES[currentRole]);
  const [token, setToken] = useState(() =>
    currentRole !== 'guest' ? 'mock_jwt_token_demo' : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Switch role seamlessly across the app
  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('demo_role', newRole);
    const profile = MOCK_PROFILES[newRole];
    setUser(profile);
    setToken(profile ? `mock_jwt_token_${newRole}` : null);
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken || 'mock_jwt_token');
    setCurrentRole(userData?.role === 'ADMIN' ? 'admin' : 'user');
  };

  const logout = () => {
    switchRole('guest');
  };

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
