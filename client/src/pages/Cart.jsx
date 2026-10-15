import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Cart() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadCart() {
    try {
      const res = await api.get('/cart');
      setItems(res.data.cart);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadCart();
    else setLoading(false);
  }, [user]);

  async function updateQuantity(id, quantity) {
    if (quantity < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity });
      loadCart();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not update quantity');
    }
  }

  async function removeItem(id) {
    try {
      await api.delete(`/cart/${id}`);
      loadCart();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not remove item');
    }
  }

  async function checkout() {
    try {
      const res = await api.post('/orders/checkout');
      setItems([]);
      setMessage(`Order #${res.data.order.id} placed! Total: $${res.data.order.total_amount}`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Checkout failed');
    }
  }

  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  if (!user) {
    return (
      <p className="text-center mt-10">
        Please <Link to="/login" className="text-blue-600 underline">log in</Link> to view your cart.
      </p>
    );
  }

  if (loading) return <p className="text-center mt-10">Loading cart...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      {items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border rounded p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-gray-500 text-sm">${item.price} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="border rounded px-2"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="border rounded px-2"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-sm ml-4 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
            <button
              onClick={checkout}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;