import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password');
    } finally {
      setSaving(false);
    }
  }

  // Someone opened /reset-password with no token in the link
  if (!token) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <p className="text-red-500 text-sm mb-4">This reset link is not valid.</p>
        <Link to="/forgot-password" className="text-blue-600 text-sm hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Password changed</h1>
        <p className="text-green-600 text-sm mb-4">
          Your password has been updated. You can log in with it now.
        </p>
        <Link to="/login" className="text-blue-600 text-sm hover:underline">
          Go to login →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Set a new password</h1>
      {error && (
        <p className="text-red-500 text-sm mb-4">
          {error}{' '}
          {error.includes('expired') && (
            <Link to="/forgot-password" className="underline">Request a new link</Link>
          )}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password (at least 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;