import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/currency';
import Stars from '../components/Stars';

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

  // Reviews
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [mine, setMine] = useState({ canReview: false, review: null });
  const [form, setForm] = useState({ rating: 0, comment: '' });
  const [reviewMessage, setReviewMessage] = useState({ text: '', isError: false });
  const [savingReview, setSavingReview] = useState(false);
  const [reviewsVersion, setReviewsVersion] = useState(0); // bump to reload reviews

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

  // Load reviews (and, when logged in, whether I can review and what I wrote)
  useEffect(() => {
    async function loadReviews() {
      try {
        const requests = [api.get(`/reviews/product/${id}`)];
        if (user) requests.push(api.get(`/reviews/product/${id}/mine`));
        const [listRes, mineRes] = await Promise.all(requests);

        setSummary(listRes.data.summary);
        setReviews(listRes.data.reviews);

        if (mineRes) {
          setMine({ canReview: mineRes.data.canReview, review: mineRes.data.review });
          if (mineRes.data.review) {
            setForm({
              rating: mineRes.data.review.rating,
              comment: mineRes.data.review.comment || '',
            });
          }
        } else {
          setMine({ canReview: false, review: null });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadReviews();
  }, [id, user, reviewsVersion]);

  async function handleAddToCart() {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/cart', { product_id: product.id, quantity });
      refreshCart();
      setMessage({ text: `Added ${quantity} to cart!`, isError: false });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not add to cart',
        isError: true,
      });
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewMessage({ text: '', isError: false });

    if (form.rating < 1) {
      setReviewMessage({ text: 'Please choose a star rating', isError: true });
      return;
    }

    setSavingReview(true);
    try {
      await api.post(`/reviews/product/${id}`, form);
      setReviewMessage({
        text: mine.review ? 'Review updated' : 'Thanks for your review!',
        isError: false,
      });
      setReviewsVersion((v) => v + 1);
    } catch (err) {
      setReviewMessage({
        text: err.response?.data?.error || 'Could not save review',
        isError: true,
      });
    } finally {
      setSavingReview(false);
    }
  }

  async function deleteReview() {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/reviews/product/${id}`);
      setForm({ rating: 0, comment: '' });
      setReviewMessage({ text: 'Review deleted', isError: false });
      setReviewsVersion((v) => v + 1);
    } catch (err) {
      setReviewMessage({
        text: err.response?.data?.error || 'Could not delete review',
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

          <div className="flex items-center gap-2 mb-3">
            <Stars value={summary.average} className="text-lg" />
            <span className="text-sm text-gray-500">
              {summary.count > 0
                ? `${summary.average} (${summary.count} ${summary.count === 1 ? 'review' : 'reviews'})`
                : 'No reviews yet'}
            </span>
          </div>

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

      {/* Reviews */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Customer reviews</h2>

        {/* Write / edit my review */}
        {!user ? (
          <p className="text-sm text-gray-500 mb-6">
            <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to write a review.
          </p>
        ) : mine.canReview ? (
          <form onSubmit={submitReview} className="border rounded-lg p-4 mb-6 space-y-3">
            <h3 className="font-semibold">
              {mine.review ? 'Your review' : 'Write a review'}
            </h3>

            {reviewMessage.text && (
              <p className={`text-sm ${reviewMessage.isError ? 'text-red-600' : 'text-green-600'}`}>
                {reviewMessage.text}
              </p>
            )}

            <Stars
              value={form.rating}
              onChange={(n) => setForm({ ...form, rating: n })}
              className="text-3xl"
            />

            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Share your thoughts (optional)"
              rows="3"
              maxLength={1000}
              className="w-full border rounded px-3 py-2"
            />

            <div className="flex gap-3">
              <button
                disabled={savingReview}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                {savingReview ? 'Saving...' : mine.review ? 'Update review' : 'Submit review'}
              </button>
              {mine.review && (
                <button
                  type="button"
                  onClick={deleteReview}
                  className="border border-red-300 text-red-600 px-6 py-2 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            You can review this product after your order for it is completed.
          </p>
        )}

        {/* All reviews */}
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} className="text-base" />
                    <span className="font-semibold text-sm">{r.user_name}</span>
                    {mine.review?.id === r.id && (
                      <span className="text-xs border border-blue-600 text-blue-600 px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="text-gray-700 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;