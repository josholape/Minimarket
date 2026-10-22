import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function StatCard({ label, value, note }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading dashboard...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  const { stats, ordersByStatus, lowStock, lowStockThreshold, topProducts, recentOrders } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          note="Excludes cancelled orders"
        />
        <StatCard
          label="Orders"
          value={stats.totalOrders}
          note={`${stats.activeOrders} not cancelled`}
        />
        <StatCard label="Average order" value={formatPrice(stats.averageOrder)} />
        <StatCard label="Customers" value={stats.customers} />
      </div>

      {/* Orders by status */}
      <h2 className="font-semibold text-lg mb-3">Orders by status</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(ordersByStatus).map(([status, count]) => (
          <Link
            key={status}
            to="/admin/orders"
            className={`rounded-lg p-4 hover:opacity-80 transition ${statusStyles[status]}`}
          >
            <p className="text-sm capitalize">{status}</p>
            <p className="text-2xl font-bold">{count}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Low stock */}
        <div>
          <h2 className="font-semibold text-lg mb-3">
            Low stock <span className="text-sm text-gray-400 font-normal">({lowStockThreshold} or fewer)</span>
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-500 text-sm border rounded-lg p-4">
              All products are well stocked.
            </p>
          ) : (
            <ul className="border rounded-lg divide-y">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3">
                  <span>{p.name}</span>
                  {p.stock === 0 ? (
                    <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">Out of stock</span>
                  ) : (
                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
                      {p.stock} left
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/products" className="text-blue-600 text-sm hover:underline inline-block mt-2">
            Manage products →
          </Link>
        </div>

        {/* Top products */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Top sellers</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm border rounded-lg p-4">No sales yet.</p>
          ) : (
            <ul className="border rounded-lg divide-y">
              {topProducts.map((p, index) => (
                <li key={p.id} className="flex items-center justify-between p-3">
                  <span>
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    {p.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {p.units_sold} sold · {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <h2 className="font-semibold text-lg mb-3">Recent orders</h2>
      {recentOrders.length === 0 ? (
        <p className="text-gray-500 text-sm">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3">#{order.id}</td>
                  <td className="p-3">{order.customer_name}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">{formatPrice(order.total_amount)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusStyles[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline inline-block mt-2">
        Manage all orders →
      </Link>
    </div>
  );
}

export default AdminDashboard;