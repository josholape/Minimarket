import { useEffect, useState } from 'react';
import api from '../api';
import { formatPrice } from '../utils/currency';

const STATUSES = [
  'pending',
  'shipped',
  'completed',
  'cancelled',
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [message, setMessage] = useState({
    text: '',
    isError: false,
  });

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await api.get('/orders/admin/all');

        if (active) {
          setOrders(response.data.orders);
        }
      } catch {
        if (active) {
          setMessage({
            text: 'Failed to load orders.',
            isError: true,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  async function changeStatus(id, status) {
    if (updatingId !== null) return;

    setUpdatingId(id);
    setMessage({ text: '', isError: false });

    try {
      await api.put(`/orders/${id}/status`, { status });

      setOrders(previous =>
        previous.map(order =>
          order.id === id ? { ...order, status } : order
        )
      );

      setMessage({
        text: `Order #${id} marked as ${status}.`,
        isError: false,
      });
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.error ||
          'Could not update order status.',
        isError: true,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <p role="status" className="p-10 text-center text-content-muted">
        Loading orders…
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-content-main sm:px-6">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Orders
        </h1>

        <p className="mt-2 text-content-muted">
          Review customer orders and update their progress.
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

      <section className="overflow-hidden rounded-2xl border border-outline bg-surface-card shadow-sm">
        {orders.length === 0 ? (
          <p className="p-6 text-content-muted">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-input text-content-main">
                <tr>
                  {[
                    'Order',
                    'Customer',
                    'Delivery address',
                    'Date',
                    'Total',
                    'Status',
                  ].map(heading => (
                    <th key={heading} scope="col" className="p-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <tr
                    key={order.id}
                    className="border-t border-outline align-top"
                  >
                    <td className="p-4 font-semibold">
                      #{order.id}
                    </td>

                    <td className="p-4">
                      <p className="font-medium">
                        {order.customer_name}
                      </p>

                      <p className="mt-1 break-all text-xs text-content-muted">
                        {order.customer_email}
                      </p>
                    </td>

                    <td className="min-w-60 p-4">
                      {order.shipping_address ? (
                        <>
                          <p className="font-medium">
                            {order.shipping_name}
                          </p>

                          <p className="mt-1 text-xs text-content-muted">
                            {order.shipping_phone}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-content-muted">
                            {order.shipping_address},{' '}
                            {order.shipping_city},{' '}
                            {order.shipping_province}{' '}
                            {order.shipping_postal_code}
                          </p>
                        </>
                      ) : (
                        <span className="text-content-muted">
                          No address recorded
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap p-4 text-content-muted">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td className="whitespace-nowrap p-4 font-semibold">
                      {formatPrice(order.total_amount)}
                    </td>

                    <td className="p-4">
                      <select
                        aria-label={`Status for order ${order.id}`}
                        value={order.status}
                        onChange={event =>
                          changeStatus(order.id, event.target.value)
                        }
                        disabled={updatingId !== null}
                        className="rounded-lg border border-outline bg-surface-input px-3 py-2 text-sm font-medium capitalize text-content-main disabled:opacity-60"
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingId === order.id && (
                        <p
                          role="status"
                          className="mt-2 text-xs text-content-muted"
                        >
                          Updating…
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}