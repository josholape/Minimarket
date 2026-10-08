import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
        setItems(res.data.items);
      } catch (err) {
        console.error(err);
        setError('Order not found');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-blue-600 text-sm hover:underline">← Back to orders</Link>

      <h1 className="text-3xl font-bold mt-4">Order #{order.id}</h1>
      <p className="text-gray-500 text-sm mb-6">
        Placed on {new Date(order.created_at).toLocaleString()} · Status: {order.status}
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border rounded p-4">
            <div>
              <p className="font-semibold">{item.name || 'Product no longer available'}</p>
              <p className="text-gray-500 text-sm">
                {item.quantity} × ${item.price_at_purchase}
              </p>
            </div>
            <p className="font-bold">
              ${(item.quantity * parseFloat(item.price_at_purchase)).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xl font-bold text-right mt-6">Total: ${order.total_amount}</p>
    </div>
  );
}

export default OrderDetail;