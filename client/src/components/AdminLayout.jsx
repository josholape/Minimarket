import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle.jsx';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', symbol: '◈' },
  { to: '/admin/products', label: 'Products', symbol: '▦' },
  { to: '/admin/orders', label: 'Orders', symbol: '≡' },
  { to: '/admin/categories', label: 'Categories', symbol: '◇' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function navigationClass({ isActive }) {
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-content-main hover:bg-surface-input hover:text-accent'
    }`;
  }

  return (
    <div className="min-h-screen bg-surface-page text-content-main lg:flex">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-outline bg-surface-card px-4 py-4 lg:hidden">
        <Link
          to="/admin/dashboard"
          className="text-xl font-bold text-accent"
        >
          MiniMarket.
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen(open => !open)}
          className="rounded-lg border border-outline px-4 py-2 text-sm font-semibold"
        >
          {menuOpen ? 'Close menu' : 'Menu'}
        </button>
      </header>

      {/* Sidebar: collapsible on mobile, always visible on desktop */}
      <aside
        id="admin-sidebar"
        className={`${
          menuOpen ? 'flex' : 'hidden'
        } flex-col border-b border-outline bg-surface-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r`}
      >
        <div className="p-6">
          <Link
            to="/admin/dashboard"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-bold tracking-tight text-accent"
          >
            MiniMarket.
          </Link>

          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-content-muted">
            Store administration
          </p>
        </div>

        <nav
          aria-label="Administration"
          className="space-y-2 px-4"
        >
          {adminLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={navigationClass}
            >
              <span
                aria-hidden="true"
                className="flex w-5 justify-center text-lg"
              >
                {link.symbol}
              </span>

              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Pushed to the bottom on desktop */}
        <div className="mt-auto space-y-5 p-4 pt-8">
          <Link
            to="/"
            className="block rounded-xl border border-outline px-4 py-3 text-sm font-semibold hover:border-accent"
          >
            Visit store ↗
          </Link>

          <div className="rounded-xl bg-surface-input p-4">
            <p className="text-sm font-semibold">
              {user.name}
            </p>

            <p className="mt-1 text-xs text-content-muted">
              Administrator
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
              Appearance
            </p>

            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-outline px-4 py-3 text-left text-sm font-semibold hover:border-accent"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* The selected admin page appears here */}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}