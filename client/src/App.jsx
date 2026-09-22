import { useState, useEffect } from 'react';
import api from './api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products);
      } catch (err) {
        console.error(err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading products...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">MiniMarket</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <img
              src={product.image_url || 'https://via.placeholder.com/200'}
              alt={product.name}
              className="w-full h-40 object-cover rounded mb-3"
            />
            <h2 className="font-semibold text-lg">{product.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{product.category_name || 'Uncategorized'}</p>
            <p className="text-blue-600 font-bold">${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;