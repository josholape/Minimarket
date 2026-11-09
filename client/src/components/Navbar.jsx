import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function AccountDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function closeDropdown() {
    setOpen(false);
  }

  function handleLogout() {
    logout();
    closeDropdown();
    navigate('/');
  }

  const itemClass =
    'block rounded-lg px-3 py-2.5 text-sm font-medium text-content-main hover:bg-surface-input hover:text-accent';

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') {
          setOpen(true);
        }
      }}
      onPointerLeave={event => {
        if (
          event.pointerType === 'mouse' &&
          !containerRef.current?.contains(document.activeElement)
        ) {
          setOpen(false);
        }
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-dropdown"
        onClick={() => setOpen(previous => !previous)}
        className="flex items-center gap-2 rounded-xl border border-outline px-3 py-2 text-left hover:border-accent"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
        >
          {user
            ? (user.name?.trim().charAt(0) || 'M').toUpperCase()
            : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            )}
        </span>

        <span className="hidden max-w-32 sm:block">
          <span className="block truncate text-xs text-content-muted">
            {user ? `Hello, ${user.name}` : 'Welcome'}
          </span>

          <span className="block text-sm font-semibold">
            My account
          </span>
        </span>

        <span className="sr-only sm:hidden">
          My account
        </span>

        <span aria-hidden="true" className="text-xs text-content-muted">
          ▾
        </span>
      </button>

      {open && (
        <div
          id="account-dropdown"
          className="absolute right-0 top-full z-50 w-64 max-w-[calc(100vw-2rem)] pt-3"
        >
          <div className="rounded-2xl border border-outline bg-surface-card p-3 shadow-xl shadow-black/15">
            {user ? (
              <>
                <div className="mb-2 rounded-xl bg-surface-input p-3">
                  <p className="break-words font-semibold">
                    {user.name}
                  </p>

                  <p className="mt-1 break-all text-xs text-content-muted">
                    {user.email}
                  </p>
                </div>

                <Link
                  to="/account"
                  onClick={closeDropdown}
                  className={itemClass}
                >
                  Account details
                </Link>

                <Link
                  to="/orders"
                  onClick={closeDropdown}
                  className={itemClass}
                >
                  My orders
                </Link>

                {user.is_admin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeDropdown}
                    className={itemClass}
                  >
                    Admin dashboard
                  </Link>
                )}

                <div className="mt-2 border-t border-outline pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-accent hover:bg-surface-input"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="p-2">
                <p className="font-semibold">
                  Welcome to MiniMarket
                </p>

                <p className="mt-2 text-sm text-content-muted">
                  Sign in to see your orders and saved details.
                </p>

                <Link
                  to="/login"
                  onClick={closeDropdown}
                  state={{ from: location.pathname }}
                  className="mt-4 block rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={closeDropdown}
                  className="mt-3 block text-center text-sm font-semibold text-accent hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);

  const params = new URLSearchParams(location.search);
  const onShopPage = location.pathname === '/';
  const search = onShopPage ? params.get('q') || '' : '';
  const selectedCategory = onShopPage
    ? params.get('category') || ''
    : '';

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await api.get('/categories');

        if (active) {
          setCategories(response.data.categories);
        }
      } catch {
        if (active) {
          setCategoryError(true);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') || '').trim();
    const next = new URLSearchParams();

    if (query) next.set('q', query);
    if (selectedCategory) {
      next.set('category', selectedCategory);
    }

    navigate(next.size ? `/?${next.toString()}` : '/');
  }

  function categoryUrl(category) {
    const next = new URLSearchParams();

    if (search) next.set('q', search);
    if (category) next.set('category', category);

    return next.size ? `/?${next.toString()}` : '/';
  }

  function categoryClass(active) {
    return `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? 'bg-brand-600 text-white'
        : 'text-content-muted hover:bg-surface-input hover:text-accent'
    }`;
  }

  return (
    <header className="border-b border-outline bg-surface-card text-content-main">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-5">
        <Link
  to="/"
  className="mr-auto flex shrink-0 items-center gap-2.5 rounded-lg lg:mr-0"
>
  <span
    aria-hidden="true"
    className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  </span>

  <span className="text-2xl font-bold tracking-tight text-accent">
    MiniMarket
  </span>
</Link>

        <form
          key={search}
          role="search"
          onSubmit={handleSearch}
          className="order-last flex w-full items-center rounded-xl border border-outline bg-surface-input focus-within:ring-2 focus-within:ring-accent lg:order-none lg:w-auto lg:flex-1"
        >
          <label htmlFor="store-search" className="sr-only">
            Search products
          </label>

          <input
            id="store-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="What are you looking for?"
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-content-main placeholder:text-content-muted focus:outline-none"
          />

          <button
            type="submit"
            aria-label="Search products"
            className="m-1 rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </button>
        </form>

        <AccountDropdown key={location.key} />

        <Link
          to="/cart"
          className="flex items-center gap-2 rounded-xl border border-outline px-3 py-3 text-sm font-semibold hover:border-accent"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" />
            <circle cx="10" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
          </svg>

          <span className="hidden sm:inline">Cart</span>

          <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
            {cartCount}
          </span>

          <span className="sr-only sm:hidden">Cart</span>
        </Link>
      </div>

      <nav
        aria-label="Product categories"
        className="border-t border-outline"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
          <Link
            to={categoryUrl('')}
            aria-current={
              onShopPage && !selectedCategory ? 'page' : undefined
            }
            className={categoryClass(
              onShopPage && !selectedCategory
            )}
          >
            All products
          </Link>

          {categories.map(category => (
            <Link
              key={category.id}
              to={categoryUrl(category.name)}
              aria-current={
                selectedCategory === category.name
                  ? 'page'
                  : undefined
              }
              className={categoryClass(
                selectedCategory === category.name
              )}
            >
              {category.name}
            </Link>
          ))}

          {categoryError && (
            <span className="shrink-0 text-xs text-content-muted">
              Categories unavailable. Refresh to try again.
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}