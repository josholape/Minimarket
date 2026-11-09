import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';
import MonthlySalesChart from '../components/MonthlySalesChart.jsx';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-900',
  shipped: 'bg-blue-100 text-blue-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-900',
};

const panelClass =
  'rounded-2xl border border-outline bg-surface-card p-5 shadow-sm';

function StatCard({ label, value, note }) {
  return (
    <div className={panelClass}>
      <p className="text-sm font-medium text-content-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold">
        {value}
      </p>

      {note && (
        <p className="mt-2 text-xs text-content-muted">
          {note}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await api.get('/admin/dashboard');

        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              'Failed to load dashboard.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p role="status" className="p-10 text-center text-content-muted">
        Loading dashboard…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-10 text-center text-accent">
        {error}
      </p>
    );
  }

  const {
    stats,
    ordersByStatus,
    lowStock,
    lowStockThreshold,
    topProducts,
    recentOrders,
    monthlySales,
  } = data;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-content-main sm:px-6">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-content-muted">
          A clear view of your store’s activity.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total order value"
          value={formatPrice(stats.revenue)}
          note="All time · excludes cancelled orders"
        />

        <StatCard
          label="Total orders"
          value={stats.totalOrders}
          note={`${stats.activeOrders} not cancelled`}
        />

        <StatCard
          label="Average order"
          value={formatPrice(stats.averageOrder)}
          note="All time · excludes cancelled orders"
        />

        <StatCard
          label="Customers"
          value={stats.customers}
          note="Non-admin accounts"
        />
      </div>

      {Array.isArray(monthlySales) ? (
        <MonthlySalesChart months={monthlySales} />
      ) : (
        <p role="status" className={`${panelClass} mb-8 text-content-muted`}>
          Monthly analytics are unavailable. Restart the backend
          after updating admin.js, then refresh.
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">
          Orders by status
        </h2>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <Link
              key={status}
              to="/admin/orders"
              className={`${panelClass} transition-colors hover:border-accent`}
            >
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusStyles[status] || ''
                }`}
              >
                {status}
              </span>

              <p className="mt-3 text-3xl font-bold">
                {count}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <section className={panelClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Stock alerts
            </h2>

            <span className="text-xs text-content-muted">
              {lowStockThreshold} or fewer remaining
            </span>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-sm text-content-muted">
              All products are well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-outline">
              {lowStock.map(product => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="text-sm font-medium">
                    {product.name}
                  </span>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                      Number(product.stock) <= 0
                        ? 'bg-slate-800 text-white'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {Number(product.stock) <= 0
                      ? 'Out of stock'
                      : `${product.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/admin/products"
            className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
          >
            Manage products →
          </Link>
        </section>

        <section className={panelClass}>
          <h2 className="mb-4 text-lg font-semibold">
            Top sellers
          </h2>

          {topProducts.length === 0 ? (
            <p className="text-sm text-content-muted">
              No sales yet.
            </p>
          ) : (
            <ol className="divide-y divide-outline">
              {topProducts.map((product, index) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span className="text-sm font-medium">
                    <span className="mr-2 text-content-muted">
                      {index + 1}.
                    </span>
                    {product.name}
                  </span>

                  <span className="text-xs text-content-muted">
                    {product.units_sold} sold ·{' '}
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className={panelClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Recent orders
          </h2>

          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-accent hover:underline"
          >
            View all orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-content-muted">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-input text-content-main">
                <tr>
                  <th scope="col" className="p-3">Order</th>
                  <th scope="col" className="p-3">Customer</th>
                  <th scope="col" className="p-3">Date</th>
                  <th scope="col" className="p-3">Total</th>
                  <th scope="col" className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    className="border-t border-outline"
                  >
                    <td className="p-3 font-medium">
                      #{order.id}
                    </td>

                    <td className="p-3">
                      {order.customer_name}
                    </td>

                    <td className="whitespace-nowrap p-3 text-content-muted">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td className="whitespace-nowrap p-3 font-semibold">
                      {formatPrice(order.total_amount)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                          statusStyles[order.status] || ''
                        }`}
                      >
                        {order.status}
                      </span>
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