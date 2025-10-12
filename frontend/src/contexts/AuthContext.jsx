import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [soldier, setSoldier] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app start
    const checkAuthStatus = async () => {
      try {
        const savedAuth = localStorage.getItem('battlefield_auth');
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          
          // Validate token expiration
          if (authData.expiresAt > Date.now()) {
            setSoldier(authData.soldier);
            setIsAuthenticated(true);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('battlefield_auth');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('battlefield_auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (soldierId, unit, rank, deviceInfo) => {
    try {
      // In a real app, this would call your backend
      const mockSoldier = {
        soldierId,
        unit,
        rank,
        permissions: getPermissions(rank),
        loginTime: new Date()
      };

      const authData = {
        soldier: mockSoldier,
        token: 'mock-jwt-token', // In real app, get from backend
        expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
      };

      setSoldier(mockSoldier);
      setIsAuthenticated(true);
      localStorage.setItem('battlefield_auth', JSON.stringify(authData));

      return { success: true, soldier: mockSoldier };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setSoldier(null);
    setIsAuthenticated(false);
    localStorage.removeItem('battlefield_auth');
  };

  const getPermissions = (rank) => {
    const permissions = {
      private: ['self:read', 'self:write', 'emergency:access'],
      corporal: ['squad:read', 'medic:access', 'triage:basic'],
      sergeant: ['platoon:read', 'medic:write', 'triage:advanced'],
      medic: ['all:read', 'medic:write', 'triage:expert'],
      officer: ['all:read', 'all:write', 'system:access']
    };

    return permissions[rank] || permissions.private;
  };

  const value = {
    soldier,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission: (permission) => {
      return soldier?.permissions?.includes(permission) || false;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};