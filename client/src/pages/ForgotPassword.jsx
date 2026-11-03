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
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>

      {sent ? (
        <>
          <p className="text-green-600 text-sm my-4">
            If that email is registered, a reset link has been sent. The link works for one hour.
          </p>
          <Link to="/login" className="text-blue-600 text-sm hover:underline">
            ← Back to login
          </Link>
        </>
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-6">
            Enter your email and we'll send you a link to set a new password.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <button
              disabled={sending}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              {sending ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p className="text-sm mt-4">
            <Link to="/login" className="text-blue-600 hover:underline">← Back to login</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default ForgotPassword;