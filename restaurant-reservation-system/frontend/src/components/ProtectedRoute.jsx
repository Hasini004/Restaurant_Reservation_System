import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * Wraps a page and enforces authentication, and optionally a specific role.
 * Usage:
 *   <ProtectedRoute><CustomerDashboard /></ProtectedRoute>
 *   <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Loader label="Checking your session…" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // Logged in, but wrong role for this page — send them to their own home.
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
