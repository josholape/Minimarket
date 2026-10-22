import { useState } from 'react';

const FIELDS = ['name', 'phone', 'address', 'city', 'province', 'postal_code'];

function AddressForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Save address', showDefault = true }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    address: initial.address || '',
    city: initial.city || '',
    province: initial.province || '',
    postal_code: initial.postal_code || '',
  });
  const [isDefault, setIsDefault] = useState(Boolean(initial.is_default));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = { is_default: isDefault };
    for (const key of FIELDS) payload[key] = form[key];

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save address');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full border rounded px-3 py-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <input name="name" placeholder="Full name" value={form.name}
        onChange={handleChange} maxLength={100} className={inputClass} required />
      <input name="phone" type="tel" placeholder="Phone number" value={form.phone}
        onChange={handleChange} maxLength={30} className={inputClass} required />
      <input name="address" placeholder="Street address, building, barangay" value={form.address}
        onChange={handleChange} maxLength={255} className={inputClass} required />
      <div className="grid grid-cols-2 gap-3">
        <input name="city" placeholder="City" value={form.city}
          onChange={handleChange} maxLength={100} className={inputClass} required />
        <input name="province" placeholder="Province" value={form.province}
          onChange={handleChange} maxLength={100} className={inputClass} required />
      </div>
      <input name="postal_code" placeholder="Postal code" value={form.postal_code}
        onChange={handleChange} maxLength={20} className={inputClass} required />

      {showDefault && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Set as default address
        </label>
      )}

      <div className="flex gap-3">
        <button disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300">
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="border px-6 py-2 rounded hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddressForm;