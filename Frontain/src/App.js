import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMaintenanceStatus } from './services/api';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import BudgetsPage from './pages/BudgetsPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import UsersPage from './pages/UsersPage';
import OrganizationsPage from './pages/OrganizationsPage';
import SettingsPage from './pages/SettingsPage';
import ComparisonPage from './pages/ComparisonPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import BudgetApproval from './pages/BudgetApproval';
import MessagingPage from './pages/MessagingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MaintenancePage from './pages/MaintenancePage';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loader" style={{ height: '100vh' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader" style={{ height: '100vh' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Maintenance-aware wrapper for non-admin protected routes
const MaintenanceProtectedRoute = ({ children, adminOnly = false, maintenance }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loader" style={{ height: '100vh' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If maintenance is on and user is not admin, show maintenance page
  if (maintenance.active && !isAdmin) {
    return <MaintenancePage message={maintenance.message} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });

  useEffect(() => {
    getMaintenanceStatus()
      .then((res) => {
        if (res.data.success) {
          setMaintenance({
            active: res.data.data.maintenanceMode,
            message: res.data.data.message,
          });
        }
      })
      .catch(() => {});
  }, []);

  const MP = ({ children, adminOnly = false }) => (
    <MaintenanceProtectedRoute maintenance={maintenance} adminOnly={adminOnly}>
      {children}
    </MaintenanceProtectedRoute>
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        maintenance.active ? <MaintenancePage message={maintenance.message} /> : <LandingPage />
      } />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          maintenance.active
            ? <MaintenancePage message={maintenance.message} />
            : <PublicRoute><RegisterPage /></PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<MP><Dashboard /></MP>} />
      <Route path="/budgets" element={<MP><BudgetsPage /></MP>} />
      <Route path="/transactions" element={<MP><TransactionsPage /></MP>} />
      <Route path="/reports" element={<MP><ReportsPage /></MP>} />
      <Route path="/departments" element={<MP><DepartmentsPage /></MP>} />
      <Route path="/profile" element={<MP><ProfilePage /></MP>} />
      <Route path="/settings" element={<MP><SettingsPage /></MP>} />
      <Route path="/comparison" element={<MP><ComparisonPage /></MP>} />
      <Route path="/budget-approvals" element={<MP><BudgetApproval /></MP>} />
      <Route path="/messages" element={<MP><MessagingPage /></MP>} />
      <Route path="/analytics" element={<MP><AnalyticsPage /></MP>} />

      {/* Admin Routes — admins always pass through */}
      <Route path="/admin" element={<MP adminOnly><AdminDashboard /></MP>} />
      <Route path="/admin/users" element={<MP adminOnly><UsersPage /></MP>} />
      <Route path="/admin/organizations" element={<MP adminOnly><OrganizationsPage /></MP>} />
      <Route path="/admin/activity-logs" element={<MP adminOnly><ActivityLogsPage /></MP>} />

      {/* Google OAuth callback handler */}
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

      {/* Password Reset */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Email Verification */}
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
