import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  async function handleAddToCart() {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart', { product_id: product.id, quantity: 1 });
      setMessage('Added to cart!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not add to cart');
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 text-sm hover:underline">← Back to products</Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-72 object-cover rounded bg-gray-100"
        />
        <div>
          <p className="text-gray-500 text-sm">{product.category_name || 'Uncategorized'}</p>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl text-blue-600 font-bold mb-4">${product.price}</p>
          <p className="text-gray-700 mb-4">{product.description}</p>
          <p className="text-sm text-gray-500 mb-4">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            Add to Cart
          </button>
          {message && <p className="text-sm mt-3 text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;