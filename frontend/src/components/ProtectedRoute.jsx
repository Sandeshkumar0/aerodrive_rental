import { Navigate } from 'react-router-dom';
import { requireAuth } from '../auth';

export default function ProtectedRoute({ children }) {
  return requireAuth() ? children : <Navigate to="/login" replace />;
}
