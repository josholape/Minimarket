import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const LOW_STOCK_THRESHOLD = 5;

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // null = "All"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ]);
        setProducts(productsRes.data.products);
        setCategories(categoriesRes.data.categories);
      } catch (err) {
        console.error(err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === null || product.category_name === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  if (loading) return <p className="text-center mt-10">Loading products...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const buttonClass = (active) =>
    `px-4 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {/* Search box */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={buttonClass(selectedCategory === null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={buttonClass(selectedCategory === category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const stock = Number(product.stock);
            const outOfStock = stock <= 0;
            const lowStock = !outOfStock && stock <= LOW_STOCK_THRESHOLD;

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition block"
              >
                <div className="relative mb-3">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={`w-full h-40 object-cover rounded bg-gray-100 ${
                      outOfStock ? 'opacity-50 grayscale' : ''
                    }`}
                  />
                  {outOfStock && (
                    <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">
                      Out of stock
                    </span>
                  )}
                  {lowStock && (
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Only {stock} left
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-lg">{product.name}</h2>
                <p className="text-gray-500 text-sm mb-2">
                  {product.category_name || 'Uncategorized'}
                </p>
                <p className="text-blue-600 font-bold">{formatPrice(product.price)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;