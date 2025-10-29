import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireUser = false }) => {
  const { isAuthenticated, isAdmin, isUser, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/user/intro" replace />;
  }

  // If user access is required but user is not a regular user
  if (requireUser && !isUser()) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
