import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';

function Account() {
  const { user, updateUser } = useAuth();

  const [memberSince, setMemberSince] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = closed, 'new' = adding, number = editing
  const [addressMessage, setAddressMessage] = useState({ text: '', isError: false });

  // Load "member since" and the saved addresses
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [profileRes, addressRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/addresses'),
        ]);
        setMemberSince(new Date(profileRes.data.user.created_at).toLocaleDateString());
        setAddresses(addressRes.data.addresses);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [user]);

  async function refreshAddresses() {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses);
    } catch (err) {
      console.error(err);
      setAddressMessage({ text: 'Failed to load addresses', isError: true });
    }
  }

  // Throws on failure so AddressForm can show the error
  async function saveAddress(values) {
    if (editingId === 'new') {
      await api.post('/addresses', values);
    } else {
      await api.put(`/addresses/${editingId}`, values);
    }
    setEditingId(null);
    setAddressMessage({ text: 'Address saved', isError: false });
    await refreshAddresses();
  }

  async function setDefaultAddress(id) {
    try {
      await api.put(`/addresses/${id}/default`);
      setAddressMessage({ text: 'Default address updated', isError: false });
      await refreshAddresses();
    } catch (err) {
      setAddressMessage({
        text: err.response?.data?.error || 'Could not set default',
        isError: true,
      });
    }
  }

  async function deleteAddress(id) {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddressMessage({ text: 'Address deleted', isError: false });
      await refreshAddresses();
    } catch (err) {
      setAddressMessage({
        text: err.response?.data?.error || 'Could not delete address',
        isError: true,
      });
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.put('/auth/me', { name });
      updateUser({ name: res.data.user.name });
      setName(res.data.user.name);
      setProfileMessage({ text: 'Profile updated', isError: false });
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.error || 'Could not update profile',
        isError: true,
      });
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match', isError: true });
      return;
    }

    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ text: 'Password changed', isError: false });
    } catch (err) {
      setPasswordMessage({
        text: err.response?.data?.error || 'Could not change password',
        isError: true,
      });
    }
  }

  if (!user) {
    return (
      <p className="text-center mt-10">
        Please <Link to="/login" className="text-blue-600 underline">log in</Link> to view your account.
      </p>
    );
  }

  const inputClass = 'w-full border rounded px-3 py-2';
  const messageClass = (m) => `text-sm mb-3 ${m.isError ? 'text-red-600' : 'text-green-600'}`;
  const editingAddress = typeof editingId === 'number'
    ? addresses.find((a) => a.id === editingId)
    : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      {/* Profile */}
      <form onSubmit={handleProfileSubmit} className="border rounded-lg p-4 mb-8 space-y-3">
        <h2 className="font-semibold text-lg">Profile</h2>

        {profileMessage.text && <p className={messageClass(profileMessage)}>{profileMessage.text}</p>}

        <div>
          <label className="block text-sm text-gray-500 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <input value={user.email} disabled className={`${inputClass} bg-gray-100 text-gray-500`} />
        </div>

        {memberSince && <p className="text-sm text-gray-500">Member since {memberSince}</p>}

        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Save changes
        </button>
      </form>

      {/* Addresses */}
      <div className="border rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">My addresses</h2>
          {editingId === null && (
            <button
              onClick={() => setEditingId('new')}
              className="text-blue-600 text-sm hover:underline"
            >
              + Add new address
            </button>
          )}
        </div>

        {addressMessage.text && <p className={messageClass(addressMessage)}>{addressMessage.text}</p>}

        {editingId === 'new' && (
          <div className="border rounded p-3 mb-4">
            <AddressForm
              initial={{ name: user.name }}
              onSubmit={saveAddress}
              onCancel={() => setEditingId(null)}
              submitLabel="Add address"
            />
          </div>
        )}

        {addresses.length === 0 && editingId !== 'new' && (
          <p className="text-gray-500 text-sm">No saved addresses yet.</p>
        )}

        <div className="space-y-3">
          {addresses.map((a) =>
            editingId === a.id ? (
              <div key={a.id} className="border rounded p-3">
                <AddressForm
                  initial={editingAddress}
                  onSubmit={saveAddress}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Save changes"
                  showDefault={!a.is_default}
                />
              </div>
            ) : (
              <div key={a.id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {a.name} <span className="text-gray-400 font-normal">| {a.phone}</span>
                    </p>
                    <p className="text-sm text-gray-600">{a.address}</p>
                    <p className="text-sm text-gray-600">
                      {a.city}, {a.province} {a.postal_code}
                    </p>
                    {a.is_default && (
                      <span className="inline-block mt-2 text-xs border border-blue-600 text-blue-600 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm shrink-0">
                    <button onClick={() => setEditingId(a.id)} className="text-blue-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteAddress(a.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                    {!a.is_default && (
                      <button
                        onClick={() => setDefaultAddress(a.id)}
                        className="text-gray-500 hover:underline"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Password */}
      <form onSubmit={handlePasswordSubmit} className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-lg">Change password</h2>

        {passwordMessage.text && <p className={messageClass(passwordMessage)}>{passwordMessage.text}</p>}

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="New password (at least 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
        />

        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Change password
        </button>
      </form>
    </div>
  );
}

export default Account;