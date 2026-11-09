import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const inputClass =
    'mt-2 w-full rounded-lg border border-white/15 bg-[#30273d] px-4 py-3 text-violet-50 placeholder:text-violet-300/60 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60';

  const passwordContainerClass =
    'mt-2 flex items-center rounded-lg border border-white/15 bg-[#30273d] focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/30';

  const passwordInputClass =
    'min-w-0 flex-1 rounded-lg border-0 bg-transparent px-4 py-3 text-violet-50 placeholder:text-violet-300/60 focus:outline-none disabled:opacity-60';

  const passwordToggleClass =
    'mr-2 shrink-0 rounded-md px-3 py-2 text-sm font-medium text-violet-200 hover:bg-white/10 disabled:opacity-60';

  const linkClass =
    'rounded text-sm font-medium text-violet-300 transition-colors hover:text-violet-200 hover:underline';

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setMessage(null);

    if (isRegister && password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setPasswordMismatch(false);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      navigate('/');
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.error ||
          'Something went wrong. Please try again.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-[#0c0912] px-4 py-12 text-violet-50">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#47206e_0%,#1c112e_45%,#0c0912_80%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-24 -z-10 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-12 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl"
      />

      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          to="/"
          className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-lg"
        >
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300"
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

          <span className="text-2xl font-bold tracking-tight text-violet-100">
            MiniMarket<span className="text-violet-400">.</span>
          </span>
        </Link>

        {/* Authentication card */}
        <section
          aria-labelledby="auth-title"
          className="rounded-2xl border border-white/10 bg-[#211b2d] p-7 shadow-2xl shadow-black/40 sm:p-10"
        >
          <header className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Your everyday marketplace
            </p>

            <h1
              id="auth-title"
              className="mt-3 font-sans text-2xl font-bold tracking-tight text-violet-50"
            >
              {isRegister
                ? 'Create your account'
                : 'Sign in to MiniMarket'}
            </h1>

            <p className="mt-3 text-sm leading-6 text-violet-200/80">
              {isRegister
                ? 'Join us and discover your next favorite.'
                : 'Welcome back. Your next find is waiting.'}
            </p>
          </header>

          {message && (
            <p
              role="alert"
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                message.isError
                  ? 'border-red-400/30 bg-red-950/50 text-red-200'
                  : 'border-violet-400/30 bg-violet-950/50 text-violet-200'
              }`}
            >
              {message.text}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            className="space-y-5"
          >
            {/* Name appears only on registration */}
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="text-sm font-medium text-violet-100"
                >
                  Full name
                </label>

                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-violet-100"
              >
                Email address
              </label>

              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                maxLength={150}
                required
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            {/* Password and toggle share one container */}
            <div>
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-violet-100"
              >
                Password
              </label>

              <div className={passwordContainerClass}>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  placeholder={
                    isRegister
                      ? 'Create a password'
                      : 'Enter your password'
                  }
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value);
                    setPasswordMismatch(false);
                  }}
                  minLength={isRegister ? 8 : undefined}
                  maxLength={isRegister ? 72 : undefined}
                  aria-describedby={
                    isRegister ? 'password-help' : undefined
                  }
                  required
                  disabled={isSubmitting}
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  aria-controls="auth-password"
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                  className={passwordToggleClass}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {isRegister && (
                <p
                  id="password-help"
                  className="mt-2 text-xs text-violet-200/80"
                >
                  Use at least 8 characters.
                </p>
              )}
            </div>

            {/* Confirmation appears only on registration */}
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="text-sm font-medium text-violet-100"
                >
                  Re-enter password
                </label>

                <div className={passwordContainerClass}>
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={event => {
                      setConfirmPassword(event.target.value);
                      setPasswordMismatch(false);
                    }}
                    minLength={8}
                    maxLength={72}
                    aria-invalid={passwordMismatch}
                    aria-describedby={
                      passwordMismatch
                        ? 'confirm-password-error'
                        : undefined
                    }
                    required
                    disabled={isSubmitting}
                    className={passwordInputClass}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(value => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirmation password'
                        : 'Show confirmation password'
                    }
                    aria-controls="auth-confirm-password"
                    aria-pressed={showConfirmPassword}
                    disabled={isSubmitting}
                    className={passwordToggleClass}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {passwordMismatch && (
                  <p
                    id="confirm-password-error"
                    role="alert"
                    className="mt-2 text-sm text-red-200"
                  >
                    Passwords do not match. Please try again.
                  </p>
                )}
              </div>
            )}

            {!isRegister && (
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className={linkClass}
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />

                  <path
                    d="M12 3a9 9 0 0 1 9 9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {isSubmitting
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            <span role="status" className="sr-only">
              {isSubmitting
                ? 'Please wait. Your request is processing.'
                : ''}
            </span>
          </form>

          <footer className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-violet-200/80">
              {isRegister
                ? 'Already have an account? '
                : 'New to MiniMarket? '}

              <Link
                to={isRegister ? '/login' : '/register'}
                className={linkClass}
              >
                {isRegister ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </footer>
        </section>

        <p className="mt-7 text-center">
          <Link
            to="/"
            className="rounded text-sm text-violet-200/80 hover:text-violet-100"
          >
            ← Back to shopping
          </Link>
        </p>
      </div>
    </main>
  );
}