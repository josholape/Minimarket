import { useState, useEffect } from 'react';
import api from '../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Failed to load categories', isError: true });
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const res = await api.post('/categories', { name });
      const added = res.data.category;
      setCategories((prev) =>
        [...prev, added].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName('');
      setMessage({ text: `Added "${added.name}"`, isError: false });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not add category',
        isError: true,
      });
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete "${category.name}"? Its products will become Uncategorized.`)) {
      return;
    }
    try {
      await api.delete(`/categories/${category.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setMessage({ text: `Deleted "${category.name}"`, isError: false });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not delete category',
        isError: true,
      });
    }
  }

  if (loading) return <p className="text-center mt-10">Loading categories...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>

      {message.text && (
        <p className={`mb-4 text-sm ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          maxLength={100}
          className="flex-1 border rounded px-3 py-2"
          required
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Add
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet.</p>
      ) : (
        <ul className="border rounded divide-y">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <span>{c.name}</span>
              <button
                onClick={() => handleDelete(c)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminCategories;