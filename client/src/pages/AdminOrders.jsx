import { useState, useEffect } from 'react';
import api from '../api';
import { formatPrice } from '../utils/currency';

const STATUSES = ['pending', 'shipped', 'completed', 'cancelled'];

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get('/orders/admin/all');
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
        setMessage({ text: 'Failed to load orders', isError: true });
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  async function changeStatus(id, status) {
    try {
      await api.put(`/orders/${id}/status`, { status });
      // Update just this order in the list, no need to reload everything
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setMessage({ text: `Order #${id} marked as ${status}`, isError: false });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not update status',
        isError: true,
      });
    }
  }

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>

      {message.text && (
        <p className={`mb-4 text-sm ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Ship to</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t align-top">
                  <td className="p-3">#{order.id}</td>
                  <td className="p-3">
                    <p>{order.customer_name}</p>
                    <p className="text-gray-500 text-xs">{order.customer_email}</p>
                  </td>
                  <td className="p-3 text-sm">
                    {order.shipping_address ? (
                      <>
                        <p>{order.shipping_name} · {order.shipping_phone}</p>
                        <p className="text-gray-500 text-xs">
                          {order.shipping_address}, {order.shipping_city}, {order.shipping_province}{' '}
                          {order.shipping_postal_code}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">{formatPrice(order.total_amount)}</td>
                  <td className="p-3">
                    <select
                      value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${statusStyles[order.status] || ''}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;