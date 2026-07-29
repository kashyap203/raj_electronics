import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
};
