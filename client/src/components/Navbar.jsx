import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          MiniMarket
        </Link>
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm items-center">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/cart" className="hover:text-blue-600 flex items-center gap-1">
            Cart
            {cartCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <Link to="/orders" className="hover:text-blue-600">Orders</Link>
          {user ? (
            <>
              {user?.is_admin && (
                <>
                  <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
                  <Link to="/admin/products" className="hover:text-blue-600">Admin</Link>
                  <Link to="/admin/orders" className="hover:text-blue-600">Manage Orders</Link>
                  <Link to="/admin/categories" className="hover:text-blue-600">Categories</Link>
                </>
              )}
              <Link to="/account" className="text-gray-500 hover:text-blue-600">Hi, {user.name}</Link>
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