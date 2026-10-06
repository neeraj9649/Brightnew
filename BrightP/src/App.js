import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { AdminBookingProvider } from './contexts/AdminBookingContext';
import { CrmProvider } from './contexts/CrmContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

// Pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './components/Dashboard/UserDashboard';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminBookingDetailPage from './pages/AdminBookingDetailPage';
import PublicCardPage from './pages/PublicCardPage';
import RewardsPage from './pages/RewardsPage';

// Components
import LoadingSpinner from './components/Common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false }) => {
  const { currentUser, loading, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Employees have no customer dashboard -- any attempt to reach /dashboard
// (typed URL, stale link, post-login redirect) bounces them to the staff view.
const CustomerDashboardRoute = () => {
  const { isStaff, isAdmin } = useAuth();
  if (isStaff && !isAdmin) return <Navigate to="/admin" replace />;
  return <DashboardPage />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (currentUser) {
    // Redirect to originally intended page or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/card/:code" element={<PublicCardPage />} />
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerDashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute>
            <RewardsPage />
          </ProtectedRoute>
        }
      />

      {/* Staff Routes (employee or admin) -- AdminDashboard itself renders a
          reduced view for employees vs the full dashboard for admins. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute staffOnly={true}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute staffOnly={true}>
            <AdminUserDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings/:id"
        element={
          <ProtectedRoute staffOnly={true}>
            <AdminBookingDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Catch All Route - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <AdminBookingProvider>
          <CrmProvider>
            <AnalyticsProvider>
              <Router>
                <div className="App">
                  <AppRoutes />

                  {/* Toast Notifications */}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#ffffff',
                        color: '#374151',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#ffffff',
                        },
                        style: {
                          borderLeft: '4px solid #10b981',
                        }
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#ffffff',
                        },
                        style: {
                          borderLeft: '4px solid #ef4444',
                        }
                      },
                      loading: {
                        iconTheme: {
                          primary: '#3b82f6',
                          secondary: '#ffffff',
                        },
                        style: {
                          borderLeft: '4px solid #3b82f6',
                        }
                      }
                    }}
                  />
                </div>
              </Router>
            </AnalyticsProvider>
          </CrmProvider>
        </AdminBookingProvider>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;