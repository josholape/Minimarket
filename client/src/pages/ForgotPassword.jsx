import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 text-content-main">
      <section className="rounded-2xl border border-outline bg-surface-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold">
          Forgot password?
        </h1>

        {sent ? (
          <>
            <p
              role="status"
              className="my-5 rounded-xl bg-surface-input p-4 text-sm leading-6 text-content-main"
            >
              If that email is registered, a reset link has been
              sent. The link works for one hour.
            </p>

            <Link
              to="/login"
              className="text-sm font-semibold text-accent hover:underline"
            >
              ← Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm leading-6 text-content-muted">
              Enter your email and we’ll send you a link to set
              a new password.
            </p>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-900"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email address
                </label>

                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-input px-4 py-3 text-content-main placeholder:text-content-muted"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-5 text-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-accent hover:underline"
              >
                ← Back to login
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default ForgotPassword;