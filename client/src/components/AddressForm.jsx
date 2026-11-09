import { useState } from 'react';

const FIELDS = [
  'name',
  'phone',
  'address',
  'city',
  'province',
  'postal_code',
];

function AddressForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save address',
  showDefault = true,
}) {
  const [form, setForm] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    address: initial.address || '',
    city: initial.city || '',
    province: initial.province || '',
    postal_code: initial.postal_code || '',
  });

  const [isDefault, setIsDefault] = useState(
    Boolean(initial.is_default)
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm(previous => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError('');
    setSaving(true);

    const payload = {
      is_default: isDefault,
    };

    for (const key of FIELDS) {
      payload[key] = form[key];
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-outline bg-surface-input px-4 py-3 text-content-main placeholder:text-content-muted disabled:opacity-60';

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={saving}
      className="space-y-3 text-content-main"
    >
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-100 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      <input
        name="name"
        type="text"
        aria-label="Full name"
        autoComplete="name"
        placeholder="Full name"
        value={form.name}
        onChange={handleChange}
        maxLength={100}
        disabled={saving}
        className={inputClass}
        required
      />

      <input
        name="phone"
        type="tel"
        aria-label="Phone number"
        autoComplete="tel"
        placeholder="Phone number"
        value={form.phone}
        onChange={handleChange}
        maxLength={30}
        disabled={saving}
        className={inputClass}
        required
      />

      <input
        name="address"
        type="text"
        aria-label="Street address"
        autoComplete="street-address"
        placeholder="Street address, building, barangay"
        value={form.address}
        onChange={handleChange}
        maxLength={255}
        disabled={saving}
        className={inputClass}
        required
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="city"
          type="text"
          aria-label="City"
          autoComplete="address-level2"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          maxLength={100}
          disabled={saving}
          className={inputClass}
          required
        />

        <input
          name="province"
          type="text"
          aria-label="Province"
          autoComplete="address-level1"
          placeholder="Province"
          value={form.province}
          onChange={handleChange}
          maxLength={100}
          disabled={saving}
          className={inputClass}
          required
        />
      </div>

      <input
        name="postal_code"
        type="text"
        aria-label="Postal code"
        autoComplete="postal-code"
        placeholder="Postal code"
        value={form.postal_code}
        onChange={handleChange}
        maxLength={20}
        disabled={saving}
        className={inputClass}
        required
      />

      {showDefault && (
        <label className="flex items-center gap-3 py-1 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={event =>
              setIsDefault(event.target.checked)
            }
            disabled={saving}
            className="h-4 w-4 accent-brand-600"
          />

          Set as default address
        </label>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-outline bg-surface-card px-5 py-3 text-sm font-semibold text-content-main transition-colors hover:bg-surface-input disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddressForm;