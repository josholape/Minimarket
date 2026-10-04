import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          MiniMarket
        </Link>
        <div className="flex gap-4 text-sm items-center">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/cart" className="hover:text-blue-600">Cart</Link>
          {user ? (
            <>
              <span className="text-gray-500">Hi, {user.name}</span>
              <button onClick={logout} className="hover:text-blue-600">Logout</button>
            </>
          ) : (
            <Link to="/login" className="hover:text-blue-600">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;