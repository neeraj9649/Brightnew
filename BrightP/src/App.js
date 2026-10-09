import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { AdminBookingProvider } from './contexts/AdminBookingContext';
import { CrmProvider } from './contexts/CrmContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

// Pages
import Landing from './portal/Landing';
import AuthPage, { WelcomePage, InactivePage } from './portal/customer/AuthScreens';
import { HomeRoute, BookingsRoute, ServiceSelectRoute, WizardRoute, BookingDetailRoute, WalletRoute, CatalogRoute, RewardDetailRoute, AccountRoute, ToAccountOnDesktop, ReferRoute } from './portal/desktop/routes';
import { BookingReceived } from './portal/customer/BookingNew';
import { QuoteReview } from './portal/customer/BookingDetail';
import StaffOverview from './portal/staff/Overview';
import StaffBookings from './portal/staff/Bookings';
import BookingWorkspace from './portal/staff/BookingWorkspace';
import Customers, { CustomerDetail } from './portal/staff/Customers';
import Employees from './portal/staff/Employees';
import { RewardCatalogAdmin, Redemptions } from './portal/staff/Rewards';
import Crm from './portal/staff/Crm';
import { LoyaltySettings, Analytics } from './portal/staff/Loyalty';
import { ConfirmRedemption, RedemptionStatus, RedemptionHistory } from './portal/customer/Rewards';
import { Notifications, TierBenefits, ReferralActivity, MembershipCardPage, PublicCard, EditProfile, Support, Security, NotificationPreferences } from './portal/customer/Member';

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

// Old links to /admin/users/:id keep working.
const LegacyUserRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/customers/${id}`} replace />;
};

// Employees have no customer dashboard -- any attempt to reach /dashboard
// (typed URL, stale link, post-login redirect) bounces them to the staff view.
const CustomerDashboardRoute = () => {
  const { isStaff, isAdmin } = useAuth();
  if (isStaff && !isAdmin) return <Navigate to="/admin" replace />;
  return <HomeRoute />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (currentUser) {
    // A brand-new member lands on the welcome screen first.
    if (sessionStorage.getItem('bw_welcome')) return <Navigate to="/welcome" replace />;
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
      <Route path="/" element={<Landing />} />
      <Route path="/card/:code" element={<PublicCard />} />
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } 
      />

      <Route path="/inactive" element={<InactivePage />} />
      <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />

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
            <BookingsRoute />
          </ProtectedRoute>
        } 
      />
      <Route path="/bookings/new" element={<ProtectedRoute><ServiceSelectRoute /></ProtectedRoute>} />
      <Route path="/bookings/new/:service" element={<ProtectedRoute><WizardRoute /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailRoute /></ProtectedRoute>} />
      <Route path="/bookings/:id/received" element={<ProtectedRoute><BookingReceived /></ProtectedRoute>} />
      <Route path="/bookings/:id/quote" element={<ProtectedRoute><QuoteReview /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountRoute /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ToAccountOnDesktop><EditProfile /></ToAccountOnDesktop></ProtectedRoute>} />
      <Route path="/rewards" element={<ProtectedRoute><WalletRoute /></ProtectedRoute>} />
      <Route path="/rewards/catalog" element={<ProtectedRoute><CatalogRoute /></ProtectedRoute>} />
      <Route path="/rewards/catalog/:id" element={<ProtectedRoute><RewardDetailRoute /></ProtectedRoute>} />
      <Route path="/rewards/catalog/:id/confirm" element={<ProtectedRoute><ConfirmRedemption /></ProtectedRoute>} />
      <Route path="/rewards/redemptions" element={<ProtectedRoute><RedemptionHistory /></ProtectedRoute>} />
      <Route path="/rewards/redemptions/:id" element={<ProtectedRoute><RedemptionStatus /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><ReferRoute /></ProtectedRoute>} />
      <Route path="/referrals/activity" element={<ProtectedRoute><ReferralActivity /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/notification-preferences" element={<ProtectedRoute><ToAccountOnDesktop><NotificationPreferences /></ToAccountOnDesktop></ProtectedRoute>} />
      <Route path="/tier-benefits" element={<ProtectedRoute><TierBenefits /></ProtectedRoute>} />
      <Route path="/membership" element={<ProtectedRoute><ToAccountOnDesktop><MembershipCardPage /></ToAccountOnDesktop></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><ToAccountOnDesktop><Security /></ToAccountOnDesktop></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

      {/* Staff routes (employee or admin). Admin-only screens redirect employees. */}
      <Route path="/admin" element={<ProtectedRoute staffOnly><StaffOverview /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute staffOnly><StaffBookings /></ProtectedRoute>} />
      <Route path="/admin/bookings/:id" element={<ProtectedRoute staffOnly><BookingWorkspace /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute staffOnly><Customers /></ProtectedRoute>} />
      <Route path="/admin/customers/:id" element={<ProtectedRoute staffOnly><CustomerDetail /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute staffOnly><LegacyUserRedirect /></ProtectedRoute>} />
      <Route path="/admin/crm" element={<ProtectedRoute staffOnly><Crm /></ProtectedRoute>} />
      <Route path="/admin/redemptions" element={<ProtectedRoute staffOnly><Redemptions /></ProtectedRoute>} />
      <Route path="/admin/rewards" element={<ProtectedRoute adminOnly><RewardCatalogAdmin /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><Analytics /></ProtectedRoute>} />
      <Route path="/admin/loyalty" element={<ProtectedRoute adminOnly><LoyaltySettings /></ProtectedRoute>} />

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
