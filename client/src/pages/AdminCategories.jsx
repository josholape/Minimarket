import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState({
    text: '',
    isError: false,
  });

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
          setMessage({
            text: 'Failed to load categories.',
            isError: true,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(event) {
    event.preventDefault();

    if (busy) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage({
        text: 'Please enter a category name.',
        isError: true,
      });
      return;
    }

    setBusy(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await api.post('/categories', {
        name: trimmedName,
      });

      const added = response.data.category;

      setCategories(previous =>
        [...previous, added].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setName('');

      setMessage({
        text: `Added "${added.name}".`,
        isError: false,
      });
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.error ||
          'Could not add category.',
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category) {
    if (busy) return;

    const confirmed = window.confirm(
      `Delete "${category.name}"? Its products will become uncategorized.`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage({ text: '', isError: false });

    try {
      await api.delete(`/categories/${category.id}`);

      setCategories(previous =>
        previous.filter(item => item.id !== category.id)
      );

      setMessage({
        text: `Deleted "${category.name}".`,
        isError: false,
      });
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.error ||
          'Could not delete category.',
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="p-10 text-center text-content-muted">
        Loading categories…
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-content-main sm:px-6">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Categories
        </h1>

        <p className="mt-2 text-content-muted">
          Organize products so shoppers can find them easily.
        </p>
      </header>

      {message.text && (
        <p
          role={message.isError ? 'alert' : 'status'}
          className={`mb-5 rounded-xl border p-4 text-sm ${
            message.isError
              ? 'border-red-300 bg-red-100 text-red-900'
              : 'border-emerald-300 bg-emerald-100 text-emerald-900'
          }`}
        >
          {message.text}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        aria-busy={busy}
        className="mb-6 rounded-2xl border border-outline bg-surface-card p-5 shadow-sm"
      >
        <label
          htmlFor="category-name"
          className="block text-sm font-semibold"
        >
          New category
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="category-name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="For example, Electronics"
            maxLength={100}
            required
            disabled={busy}
            className="min-w-0 flex-1 rounded-lg border border-outline bg-surface-input px-3 py-2.5 text-content-main placeholder:text-content-muted disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add category
          </button>
        </div>

        {busy && (
          <p role="status" className="mt-3 text-sm text-content-muted">
            Saving changes…
          </p>
        )}
      </form>

      <section className="overflow-hidden rounded-2xl border border-outline bg-surface-card">
        <div className="border-b border-outline p-5">
          <h2 className="font-semibold">
            Your categories
          </h2>

          <p className="mt-1 text-sm text-content-muted">
            {categories.length} categories
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="p-5 text-sm text-content-muted">
            No categories yet. Add your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-outline">
            {categories.map(category => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <span className="min-w-0 break-words font-medium">
                  {category.name}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  disabled={busy}
                  aria-label={`Delete ${category.name}`}
                  className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-red-200 disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}