import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  function navigationClass({ isActive }) {
    return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-content-main hover:bg-surface-input hover:text-accent'
    }`;
  }

  return (
    <header className="border-b border-outline bg-surface-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-accent"
        >
          MiniMarket.
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-1"
        >
          <NavLink to="/" end className={navigationClass}>
            Shop
          </NavLink>

          <NavLink to="/cart" className={navigationClass}>
            Cart

            {cartCount > 0 && (
              <span className="rounded-full bg-surface-card px-2 py-0.5 text-xs font-bold text-accent">
                {cartCount}
              </span>
            )}
          </NavLink>

          {user ? (
            <>
              <NavLink to="/orders" className={navigationClass}>
                Orders
              </NavLink>

              <NavLink to="/account" className={navigationClass}>
                My account
              </NavLink>

              {user.is_admin && (
                <NavLink
                  to="/admin/dashboard"
                  className={navigationClass}
                >
                  Admin
                </NavLink>
              )}

              <button
                type="button"
                onClick={logout}
                className="ml-2 rounded-lg border border-outline px-3 py-2 text-sm font-medium text-content-main hover:border-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navigationClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}