import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoadingScreen.css';

export function ProtectedRoute({ children, requireDoctor, requirePatient }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireDoctor && user.type !== 'doctor') {
    return <Navigate to="/patient" replace />;
  }

  if (requirePatient && user.type !== 'patient') {
    return <Navigate to="/doctor" replace />;
  }

  return children;
}
