import { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  category_id: '',
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      const [p, c] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(p.data.products);
      setCategories(c.data.categories);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load data');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10) || 0,
      image_url: form.image_url || null,
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage('Product updated');
      } else {
        await api.post('/products', payload);
        setMessage('Product created');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Save failed');
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      category_id: product.category_id || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage('Product deleted');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Delete failed');
    }
  }

  const inputClass = 'w-full border rounded px-3 py-2';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-8 space-y-3">
        <h2 className="font-semibold text-lg">
          {editingId ? `Edit product #${editingId}` : 'Add a new product'}
        </h2>

        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className={inputClass} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className={inputClass} rows="3" />

        <div className="grid grid-cols-2 gap-3">
          <input name="price" type="number" step="0.01" min="0" placeholder="Price" value={form.price} onChange={handleChange} className={inputClass} required />
          <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={handleChange} className={inputClass} />
        </div>

        <input name="image_url" placeholder="Image URL (e.g. /images/mouse.jpg)" value={form.image_url} onChange={handleChange} className={inputClass} />

        <select name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="border px-6 py-2 rounded hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border">
          <thead className="bg-gray-50 text-sm">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.id}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category_name || '—'}</td>
                <td className="p-3">${p.price}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 space-x-3">
                  <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-gray-500 mt-4">No products yet.</p>}
      </div>
    </div>
  );
}

export default AdminProducts;