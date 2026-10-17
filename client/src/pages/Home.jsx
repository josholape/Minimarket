import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // null = "All"
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
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

  // Filter first, then sort the result
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesCategory =
        selectedCategory === null || product.category_name === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });

    // filter() returns a new array, so sorting it does not touch `products`
    result.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default: // 'newest'
          return b.id - a.id;
      }
    });

    return result;
  }, [products, search, selectedCategory, sort]);

  // Changing the search, category or sort always goes back to page 1
  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function selectCategory(name) {
    setSelectedCategory(name);
    setPage(1);
  }

  function handleSortChange(e) {
    setSort(e.target.value);
    setPage(1);
  }

  function goToPage(n) {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <p className="text-center mt-10">Loading products...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  // Pagination math (derived from the filtered list, not stored in state)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages); // safety if the list shrinks
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  const buttonClass = (active) =>
    `px-4 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`;

  const pageButtonClass = (active) =>
    `min-w-9 h-9 px-3 rounded border text-sm transition ${
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
        onChange={handleSearchChange}
        placeholder="Search products..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => selectCategory(null)}
          className={buttonClass(selectedCategory === null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => selectCategory(category.name)}
            className={buttonClass(selectedCategory === category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <label htmlFor="sort" className="text-sm text-gray-500">Sort by</label>
        <select
          id="sort"
          value={sort}
          onChange={handleSortChange}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products match your search.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {startIndex + 1}–{startIndex + pageProducts.length} of{' '}
            {filteredProducts.length} products
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pageProducts.map((product) => {
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

          {/* Pagination controls (only when there is more than one page) */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 h-9 rounded border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  className={pageButtonClass(n === currentPage)}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 h-9 rounded border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;