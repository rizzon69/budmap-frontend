import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('budmap_token');
    const savedUser = localStorage.getItem('budmap_user');

    if (token && savedUser) {
      try {
        const response = await authAPI.getProfile();
        if (response.data.success) {
          setUser(response.data.data.user);
          setOrganization(response.data.data.organization);
        }
      } catch (err) {
        localStorage.removeItem('budmap_token');
        localStorage.removeItem('budmap_user');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { user, organization, token } = response.data.data;
        localStorage.setItem('budmap_token', token);
        localStorage.setItem('budmap_user', JSON.stringify(user));
        setUser(user);
        setOrganization(organization);
        return { success: true };
      }
    } catch (err) {
      const code    = err.response?.data?.code;
      const message = err.response?.data?.message || 'Login failed';
      const email2  = err.response?.data?.email;
      setError(message);
      return { success: false, error: message, code, email: email2 };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Always use /api/registration/user — it issues the verify token correctly.
      // /api/auth/register also issues a token but then /registration/user
      // deletes it (EmailToken.deleteMany), causing "verification failed".
      const { default: axios } = await import('axios');
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${base}/registration/user`, userData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data.success) {
        return {
          success: true,
          needsVerification: true,
          email: userData.email,
          verificationLink: response.data.verificationLink, // dev only
          message: response.data.message,
        };
      }
      return { success: false, error: response.data.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('budmap_token');
    localStorage.removeItem('budmap_user');
    setUser(null);
    setOrganization(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('budmap_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'admin';
  const isFinanceOfficer = user?.role === 'finance_officer';
  const isDepartmentHead = user?.role === 'department_head';
  const isViewer = user?.role === 'viewer';

  const canManageBudgets = isAdmin || isFinanceOfficer;
  const canApproveBudgets = isAdmin || isFinanceOfficer;
  const canCreateTransactions = isAdmin || isFinanceOfficer || isDepartmentHead;
  const canApproveTransactions = isAdmin || isFinanceOfficer;
  // All authenticated users can view transactions, but Viewers only see completed ones
  const canViewTransactions = isAdmin || isFinanceOfficer || isDepartmentHead || isViewer;
  const isViewerOnly = isViewer && !isAdmin && !isFinanceOfficer && !isDepartmentHead;

  const value = {
    user,
    organization,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin,
    isFinanceOfficer,
    isDepartmentHead,
    isViewer,
    canManageBudgets,
    canApproveBudgets,
    canCreateTransactions,
    canApproveTransactions,
    canViewTransactions,
    isViewerOnly,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
