import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) {
    return <p className="text-center mt-10 text-red-500">Admins only.</p>;
  }
  return children;
}

export default AdminRoute;