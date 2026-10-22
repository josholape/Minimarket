import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const STATUS_INFO = {
  pending: {
    title: 'Order received',
    message: "We've received your order and are getting it ready.",
    box: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  shipped: {
    title: 'Your order has shipped',
    message: 'Your order is on its way to you.',
    box: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  completed: {
    title: 'Order completed',
    message: 'Your order has been delivered. Thank you for shopping with us!',
    box: 'bg-green-50 border-green-200 text-green-800',
  },
  cancelled: {
    title: 'Order cancelled',
    message: 'This order was cancelled.',
    box: 'bg-red-50 border-red-200 text-red-800',
  },
};

const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
];

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

  const info = STATUS_INFO[order.status];
  const currentStep = STEPS.findIndex((s) => s.key === order.status); // -1 if cancelled

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-blue-600 text-sm hover:underline">← Back to orders</Link>

      <h1 className="text-3xl font-bold mt-4">Order #{order.id}</h1>
      <p className="text-gray-500 text-sm mb-6">
        Placed on {new Date(order.created_at).toLocaleString()}
      </p>

      {/* Status message */}
      {info && (
        <div className={`border rounded-lg p-4 mb-6 ${info.box}`}>
          <p className="font-semibold">{info.title}</p>
          <p className="text-sm">{info.message}</p>
        </div>
      )}

      {/* Progress tracker (hidden for cancelled orders) */}
      {currentStep !== -1 && (
        <div className="flex items-center mb-8">
          {STEPS.map((step, index) => {
            const reached = index <= currentStep;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      reached ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {reached ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-1 ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 mb-5 rounded ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border rounded p-4">
            <div>
              <p className="font-semibold">{item.name || 'Product no longer available'}</p>
              <p className="text-gray-500 text-sm">
                {item.quantity} × {formatPrice(item.price_at_purchase)}
              </p>
            </div>
            <p className="font-bold">
              {formatPrice(item.quantity * parseFloat(item.price_at_purchase))}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xl font-bold text-right mt-6">Total: {formatPrice(order.total_amount)}</p>

      {/* Shipping address (older orders don't have one) */}
      {order.shipping_address && (
        <div className="border rounded-lg p-4 mt-8">
          <h2 className="font-semibold mb-2">Shipping to</h2>
          <p>{order.shipping_name}</p>
          <p className="text-gray-600 text-sm">{order.shipping_phone}</p>
          <p className="text-gray-600 text-sm">{order.shipping_address}</p>
          <p className="text-gray-600 text-sm">
            {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;