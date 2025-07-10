import { type JSX } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getTokenFromLocation, isAuthenticated, storeToken } from '../services/auth';

interface ProtectedRouteProps {
  element: JSX.Element;
}

const ProtectedRoute = ({ element }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = getTokenFromLocation(location) ?? undefined;

  if (token) {
    storeToken(token);
  }

  return isAuthenticated(token) ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;