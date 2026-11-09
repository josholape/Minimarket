import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm.jsx';

const cardClass =
  'rounded-2xl border border-outline bg-surface-card p-5 shadow-sm sm:p-6';

const inputClass =
  'mt-2 w-full rounded-xl border border-outline bg-surface-input px-4 py-3 text-content-main placeholder:text-content-muted disabled:opacity-60';

const buttonClass =
  'rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60';

function Feedback({ message }) {
  if (!message.text) return null;

  return (
    <p
      role={message.isError ? 'alert' : 'status'}
      className={`rounded-xl border p-3 text-sm ${
        message.isError
          ? 'border-red-300 bg-red-100 text-red-900'
          : 'border-emerald-300 bg-emerald-100 text-emerald-900'
      }`}
    >
      {message.text}
    </p>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  disabled,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>

      <div className="mt-2 flex items-center rounded-xl border border-outline bg-surface-input focus-within:ring-2 focus-within:ring-accent">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-content-main focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setVisible(previous => !previous)}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          disabled={disabled}
          className="mr-2 shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-surface-card disabled:opacity-60"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <section className={`${cardClass} text-center`}>
          <h1 className="text-2xl font-bold">
            Your account
          </h1>

          <p className="mt-3 text-content-muted">
            Sign in to manage your details and addresses.
          </p>

          <Link
            to="/login"
            className={`${buttonClass} mt-6 inline-block`}
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  // Reset local form state if a different account signs in.
  return <AccountDetails key={user.id} />;
}

function AccountDetails() {
  const { user, updateUser } = useAuth();
  const userId = user.id;

  const [name, setName] = useState(user.name || '');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);

  const [profileMessage, setProfileMessage] = useState({
    text: '',
    isError: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressMessage, setAddressMessage] = useState({
    text: '',
    isError: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    text: '',
    isError: false,
  });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [profileResponse, addressResponse] =
          await Promise.all([
            api.get('/auth/me'),
            api.get('/addresses'),
          ]);

        if (!active) return;

        const profile = profileResponse.data.user;

        setName(profile.name);
        setMemberSince(
          new Date(profile.created_at).toLocaleDateString(
            undefined,
            { year: 'numeric', month: 'long', day: 'numeric' }
          )
        );
        setAddresses(addressResponse.data.addresses);
      } catch {
        if (active) {
          setProfileMessage({
            text: 'Some account details could not load. Please refresh to try again.',
            isError: true,
          });
          setAddressMessage({
            text: 'Please refresh before managing your addresses.',
            isError: true,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [userId]);

  async function refreshAddresses() {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data.addresses);
    } catch {
      setAddressMessage({
        text: 'Your change was saved, but the address list could not refresh. Please reload the page.',
        isError: true,
      });
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (savingProfile) return;

    if (!name.trim()) {
      setProfileMessage({
        text: 'Please enter your name.',
        isError: true,
      });
      return;
    }

    setSavingProfile(true);
    setProfileMessage({ text: '', isError: false });

    try {
      const response = await api.put('/auth/me', {
        name: name.trim(),
      });

      updateUser({ name: response.data.user.name });
      setName(response.data.user.name);

      setProfileMessage({
        text: 'Your profile has been updated.',
        isError: false,
      });
    } catch (err) {
      setProfileMessage({
        text:
          err.response?.data?.error ||
          'Could not update your profile.',
        isError: true,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAddress(values) {
    // Errors are handled by AddressForm.
    if (editingId === 'new') {
      await api.post('/addresses', values);
    } else {
      await api.put(`/addresses/${editingId}`, values);
    }

    setEditingId(null);
    setAddressMessage({
      text: 'Address saved.',
      isError: false,
    });

    await refreshAddresses();
  }

  async function changeAddress(address, action) {
    if (addressBusy) return;

    if (
      action === 'delete' &&
      !window.confirm('Delete this saved address?')
    ) {
      return;
    }

    setAddressBusy(true);
    setAddressMessage({ text: '', isError: false });

    try {
      if (action === 'delete') {
        await api.delete(`/addresses/${address.id}`);
      } else {
        await api.put(`/addresses/${address.id}/default`);
      }

      setAddressMessage({
        text:
          action === 'delete'
            ? 'Address deleted.'
            : 'Default address updated.',
        isError: false,
      });

      await refreshAddresses();
    } catch (err) {
      setAddressMessage({
        text:
          err.response?.data?.error ||
          'Could not update your addresses.',
        isError: true,
      });
    } finally {
      setAddressBusy(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (savingPassword) return;

    setPasswordMessage({ text: '', isError: false });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        text: 'The new passwords do not match.',
        isError: true,
      });
      return;
    }

    setSavingPassword(true);

    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setPasswordMessage({
        text: 'Your password has been changed.',
        isError: false,
      });
    } catch (err) {
      setPasswordMessage({
        text:
          err.response?.data?.error ||
          'Could not change your password.',
        isError: true,
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="p-12 text-center text-content-muted">
        Loading your account…
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-content-main">
      <header className="mb-8 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white"
        >
          {(user.name?.trim().charAt(0) || 'M').toUpperCase()}
        </span>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My account
          </h1>

          <p className="mt-1 text-content-muted">
            Your details, delivery addresses, and security.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Profile */}
        <section className={cardClass}>
          <h2 className="text-lg font-bold">
            Personal details
          </h2>

          <p className="mt-1 text-sm text-content-muted">
            Keep your name up to date.
          </p>

          <form
            onSubmit={handleProfileSubmit}
            aria-busy={savingProfile}
            className="mt-5 space-y-4"
          >
            <Feedback message={profileMessage} />

            <div>
              <label htmlFor="account-name" className="text-sm font-semibold">
                Full name
              </label>

              <input
                id="account-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={100}
                required
                disabled={savingProfile}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="account-email" className="text-sm font-semibold">
                Email address
              </label>

              <input
                id="account-email"
                type="email"
                value={user.email}
                readOnly
                aria-describedby="account-email-help"
                className={inputClass}
              />

              <p
                id="account-email-help"
                className="mt-2 text-xs text-content-muted"
              >
                Your sign-in email cannot be changed here.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-content-muted">
                {memberSince && `Member since ${memberSince}`}
              </p>

              <button
                type="submit"
                disabled={savingProfile}
                className={buttonClass}
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Addresses */}
        <section className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                Delivery addresses
              </h2>

              <p className="mt-1 text-sm text-content-muted">
                Save an address for a quicker checkout.
              </p>
            </div>

            {editingId === null && (
              <button
                type="button"
                disabled={addressBusy}
                onClick={() => {
                  setAddressMessage({ text: '', isError: false });
                  setEditingId('new');
                }}
                className="rounded-lg border border-outline px-4 py-2 text-sm font-semibold text-accent hover:border-accent disabled:opacity-60"
              >
                + Add address
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <Feedback message={addressMessage} />

            {editingId === 'new' && (
              <div className="rounded-xl border border-outline p-4">
                <h3 className="mb-4 font-semibold">
                  New address
                </h3>

                <AddressForm
                  initial={{ name: user.name }}
                  onSubmit={saveAddress}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Add address"
                />
              </div>
            )}

            {addresses.length === 0 && editingId !== 'new' && (
              <div className="rounded-xl bg-surface-input p-6 text-center">
                <p className="font-semibold">
                  No saved addresses yet
                </p>

                <p className="mt-2 text-sm text-content-muted">
                  Add your first delivery address above.
                </p>
              </div>
            )}

            {addresses.map(address => (
              <div
                key={address.id}
                className="rounded-xl border border-outline p-4"
              >
                {editingId === address.id ? (
                  <AddressForm
                    initial={address}
                    onSubmit={saveAddress}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save address"
                    showDefault={!address.is_default}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {address.name}
                      </h3>

                      {address.is_default && (
                        <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-content-muted">
                      {address.phone}
                    </p>

                    <p className="mt-2 break-words text-sm leading-6 text-content-muted">
                      {address.address}
                      <br />
                      {address.city}, {address.province}{' '}
                      {address.postal_code}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-outline pt-3">
                      <button
                        type="button"
                        disabled={addressBusy || editingId !== null}
                        onClick={() => {
                          setAddressMessage({ text: '', isError: false });
                          setEditingId(address.id);
                        }}
                        className="rounded text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {!address.is_default && (
                        <button
                          type="button"
                          disabled={addressBusy || editingId !== null}
                          onClick={() => changeAddress(address, 'default')}
                          className="rounded text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                        >
                          Make default
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={addressBusy || editingId !== null}
                        onClick={() => changeAddress(address, 'delete')}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-900 hover:bg-red-200 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addressBusy && (
              <p role="status" className="text-sm text-content-muted">
                Updating addresses…
              </p>
            )}
          </div>
        </section>

        {/* Password */}
        <section className={cardClass}>
          <h2 className="text-lg font-bold">
            Password & security
          </h2>

          <p className="mt-1 text-sm text-content-muted">
            Choose a password with at least 8 characters.
          </p>

          <form
            onSubmit={handlePasswordSubmit}
            aria-busy={savingPassword}
            className="mt-5 space-y-4"
          >
            <Feedback message={passwordMessage} />

            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              disabled={savingPassword}
            />

            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              disabled={savingPassword}
            />

            <PasswordField
              id="confirm-password"
              label="Re-enter new password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              disabled={savingPassword}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className={buttonClass}
              >
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}