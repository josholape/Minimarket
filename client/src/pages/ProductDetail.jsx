import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/currency';

function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [quantity, setQuantity] = useState(1);

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
      await api.post('/cart', { product_id: product.id, quantity });
      refreshCart();
      setMessage({
        text: `Added ${quantity} to cart!`,
        isError: false,
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not add to cart',
        isError: true,
      });
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const stock = Number(product.stock);
  const outOfStock = stock <= 0;

  // Keep the quantity between 1 and the available stock
  function changeQuantity(next) {
    setQuantity(Math.min(Math.max(1, next), stock));
  }

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
          <p className="text-2xl text-blue-600 font-bold mb-4">{formatPrice(product.price)}</p>
          <p className="text-gray-700 mb-4">{product.description}</p>
          <p className="text-sm text-gray-500 mb-4">
            {outOfStock ? 'Out of stock' : `${stock} in stock`}
          </p>

          {!outOfStock && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">Quantity</span>
              <button
                type="button"
                onClick={() => changeQuantity(quantity - 1)}
                disabled={quantity <= 1}
                className="border rounded px-3 py-1 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => changeQuantity(quantity + 1)}
                disabled={quantity >= stock}
                className="border rounded px-3 py-1 disabled:opacity-40"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            Add to Cart
          </button>

          {message.text && (
            <p className={`text-sm mt-3 ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;