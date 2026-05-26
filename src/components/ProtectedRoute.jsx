import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute – wraps any route that requires authentication.
 *
 * Props:
 *   requiredRole  (optional) – if provided, also enforces a specific role.
 *
 * Behaviour:
 *   - No token             → redirect to /login
 *   - Wrong role           → redirect to /dashboard
 *   - Authenticated        → render children
 */
function ProtectedRoute({ children, requiredRole }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
