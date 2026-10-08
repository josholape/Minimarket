import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    async function loadOrders() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (!user) {
    return (
      <p className="text-center mt-10">
        Please <Link to="/login" className="text-blue-600 underline">log in</Link> to view your orders.
      </p>
    );
  }

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">
          You haven't placed any orders yet. <Link to="/" className="text-blue-600 underline">Start shopping</Link>
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between border rounded-lg p-4 hover:shadow-md transition"
            >
              <div>
                <p className="font-semibold">Order #{order.id}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded ${statusStyles[order.status] || ''}`}>
                  {order.status}
                </span>
                <span className="font-bold">${order.total_amount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;