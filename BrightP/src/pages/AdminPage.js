import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import StaffPortalV2 from './StaffPortalV2';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const AdminPage = () => {
  // Both employees and admins use this staff view -- AdminDashboard renders a
  // reduced version for employees. Gating on isAdmin here would bounce an
  // employee back to /dashboard, which re-routes them to /admin, causing an
  // infinite redirect loop (white screen). Only plain customers are turned away.
  const { isStaff, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return <StaffPortalV2 />;
};

export default AdminPage;
