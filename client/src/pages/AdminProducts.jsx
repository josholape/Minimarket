import { useEffect, useState } from 'react';
import api from '../api';
import { formatPrice } from '../utils/currency';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  category_id: '',
};

const inputClass =
  'mt-2 w-full rounded-lg border border-outline bg-surface-input px-3 py-2.5 text-content-main placeholder:text-content-muted disabled:opacity-60';

const labelClass =
  'block text-sm font-semibold text-content-main';

const primaryButtonClass =
  'rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState({
    text: '',
    isError: false,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function loadData() {
    try {
      const [productsResponse, categoriesResponse] =
        await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ]);

      setProducts(productsResponse.data.products);
      setCategories(categoriesResponse.data.categories);
    } catch {
      setMessage({
        text: 'Failed to load products or categories.',
        isError: true,
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));
  }

  async function uploadImage(file) {
    if (!file || uploading || saving) return;

    if (!file.type.startsWith('image/')) {
      setMessage({
        text: 'Please choose an image file.',
        isError: true,
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage({
        text: 'Please choose an image no larger than 4 MB.',
        isError: true,
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await api.post('/upload', uploadData);

      setForm(previous => ({
        ...previous,
        image_url: response.data.image_url,
      }));

      setMessage({
        text: 'Image uploaded. Save the product to apply it.',
        isError: false,
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Image upload failed.',
        isError: true,
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    uploadImage(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || uploading) return;

    setSaving(true);
    setMessage({ text: '', isError: false });

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock || 0),
      image_url: form.image_url.trim() || null,
      category_id: form.category_id
        ? Number(form.category_id)
        : null,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setMessage({
        text: editingId ? 'Product updated.' : 'Product created.',
        isError: false,
      });

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not save product.',
        isError: true,
      });
    } finally {
      setSaving(false);
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

    setMessage({ text: '', isError: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage({ text: '', isError: false });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      setMessage({
        text: 'Product deleted.',
        isError: false,
      });

      await loadData();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not delete product.',
        isError: true,
      });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-content-main sm:px-6">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Products
        </h1>

        <p className="mt-2 text-content-muted">
          Add products and keep your catalog up to date.
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
        onSubmit={handleSubmit}
        aria-busy={saving || uploading}
        className="mb-8 rounded-2xl border border-outline bg-surface-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="mb-5 text-lg font-semibold">
          {editingId ? `Edit product #${editingId}` : 'Add a product'}
        </h2>

        <fieldset
          disabled={saving || uploading}
          className="min-w-0 space-y-4"
        >
          <div>
            <label htmlFor="product-name" className={labelClass}>
              Product name
            </label>

            <input
              id="product-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={200}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="product-description" className={labelClass}>
              Description
            </label>

            <textarea
              id="product-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className={labelClass}>
                Price (PHP)
              </label>

              <input
                id="product-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="product-stock" className={labelClass}>
                Stock
              </label>

              <input
                id="product-stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div
            onDragOver={event => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-5 ${
              dragging
                ? 'border-accent bg-surface-input'
                : 'border-outline'
            }`}
          >
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Product preview"
                className="mx-auto mb-4 h-32 max-w-full rounded-lg object-contain"
              />
            )}

            <label htmlFor="product-file" className={labelClass}>
              Product image
            </label>

            <p className="mt-1 text-sm text-content-muted">
              Drag an image here or choose a file. Maximum 4 MB.
            </p>

            <input
              id="product-file"
              type="file"
              accept="image/*"
              onChange={event => {
                uploadImage(event.target.files[0]);
                event.target.value = '';
              }}
              className="mt-3 block w-full text-sm text-content-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
          </div>

          <div>
            <label htmlFor="product-image-url" className={labelClass}>
              Image URL
            </label>

            <input
              id="product-image-url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="Or paste an image URL"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="product-category" className={labelClass}>
              Category
            </label>

            <select
              id="product-category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">No category</option>

              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className={primaryButtonClass}>
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Add product'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-outline px-5 py-2.5 font-semibold hover:bg-surface-input"
              >
                Cancel
              </button>
            )}
          </div>
        </fieldset>

        {uploading && (
          <p role="status" className="mt-3 text-sm text-content-muted">
            Uploading image…
          </p>
        )}
      </form>

      <section className="overflow-hidden rounded-2xl border border-outline bg-surface-card">
        <h2 className="p-5 text-lg font-semibold">
          Product catalog
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-input text-content-main">
              <tr>
                {['ID', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(
                  heading => (
                    <th key={heading} scope="col" className="p-3">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {products.map(product => (
                <tr
                  key={product.id}
                  className="border-t border-outline"
                >
                  <td className="p-3">{product.id}</td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-content-muted">
                    {product.category_name || 'Uncategorized'}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {formatPrice(product.price)}
                  </td>
                  <td className="p-3">{product.stock}</td>

                  <td className="whitespace-nowrap p-3">
                    <button
                      type="button"
                      disabled={saving || uploading}
                      onClick={() => startEdit(product)}
                      className="mr-4 font-semibold text-accent hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={saving || uploading}
                      onClick={() => handleDelete(product.id)}
                      className="rounded-md bg-red-100 px-2 py-1 font-semibold text-red-900 hover:bg-red-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <p className="p-5 text-sm text-content-muted">
            No products yet.
          </p>
        )}
      </section>
    </main>
  );
}