import { Navigate } from 'react-router-dom';
import { getStoredAuth, requireAuth } from '../auth';

export default function AdminRoute({ children }) {
  const { user } = getStoredAuth();
  if (!requireAuth()) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return children;
}
