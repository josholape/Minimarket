import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 8;
const LOW_STOCK_THRESHOLD = 5;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [productsResponse, categoriesResponse] =
          await Promise.all([
            api.get('/products'),
            api.get('/categories'),
          ]);

        if (!active) return;

        setProducts(productsResponse.data.products);
        setCategories(categoriesResponse.data.categories);
      } catch {
        if (active) {
          setError('We couldn’t load the products. Please refresh to try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = products.filter(product => {
      const matchesCategory =
        selectedCategory === null ||
        product.category_name === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    result.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);

        case 'price-desc':
          return Number(b.price) - Number(a.price);

        case 'name-asc':
          return a.name.localeCompare(b.name);

        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [products, search, selectedCategory, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const pageProducts = filteredProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function selectCategory(category) {
    setSelectedCategory(category);
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setSelectedCategory(null);
    setSort('newest');
    setPage(1);
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function categoryClass(active) {
    return `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-outline bg-surface-card text-content-main hover:border-accent'
    }`;
  }

  function paginationClass(active) {
    return `min-h-10 min-w-10 rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-outline bg-surface-card text-content-main enabled:hover:border-accent'
    }`;
  }

  if (loading) {
    return (
      <p role="status" className="p-12 text-center text-content-muted">
        Loading products…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-12 text-center text-accent">
        {error}
      </p>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Discover MiniMarket
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-content-main sm:text-4xl">
          Find your next favorite
        </h1>

        <p className="mt-3 text-content-muted">
          Browse by category or search for something you love.
        </p>
      </header>

      {/* Search and category controls */}
      <section
        aria-label="Filter products"
        className="mb-7 rounded-2xl border border-outline bg-surface-card p-5 sm:p-6"
      >
        <label
          htmlFor="product-search"
          className="mb-2 block text-sm font-semibold text-content-main"
        >
          Search products
        </label>

        <input
          id="product-search"
          type="search"
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Try a keyboard, book, or mouse…"
          className="w-full rounded-xl border border-outline bg-surface-input px-4 py-3 text-content-main placeholder:text-content-muted"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            aria-pressed={selectedCategory === null}
            className={categoryClass(selectedCategory === null)}
          >
            All products
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.name)}
              aria-pressed={selectedCategory === category.name}
              className={categoryClass(
                selectedCategory === category.name
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Results and sorting */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p
          role="status"
          className="text-sm font-medium text-content-muted"
        >
          {filteredProducts.length > 0
            ? `Showing ${startIndex + 1}–${
                startIndex + pageProducts.length
              } of ${filteredProducts.length} products`
            : 'No products found'}
        </p>

        <div className="flex items-center gap-3">
          <label
            htmlFor="product-sort"
            className="shrink-0 text-sm font-semibold text-content-main"
          >
            Sort by
          </label>

          <select
            id="product-sort"
            value={sort}
            onChange={event => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-outline bg-surface-input px-3 py-2 text-sm font-medium text-content-main"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pageProducts.length === 0 ? (
        <div className="rounded-2xl border border-outline bg-surface-card p-10 text-center">
          <h2 className="text-xl font-semibold">
            No matches this time
          </h2>

          <p className="mt-2 text-content-muted">
            Try another search or browse all products.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pageProducts.map(product => {
            const stock = Number(product.stock);
            const outOfStock = stock <= 0;

            const lowStock =
              !outOfStock && stock <= LOW_STOCK_THRESHOLD;

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-outline bg-surface-card p-3 text-content-main shadow-sm transition-colors hover:border-accent"
              >
                <div className="relative overflow-hidden rounded-xl bg-surface-input">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className={`h-48 w-full object-contain p-2 ${
                      outOfStock ? 'grayscale' : ''
                    }`}
                  />

                  {outOfStock && (
                    <span className="absolute left-2 top-2 rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white">
                      Out of stock
                    </span>
                  )}

                  {lowStock && (
                    <span className="absolute left-2 top-2 rounded-md bg-amber-200 px-2 py-1 text-xs font-bold text-amber-950">
                      Only {stock} left
                    </span>
                  )}
                </div>

                <div className="px-1 pb-2 pt-4">
                  <p className="mb-1 text-xs font-medium text-content-muted">
                    {product.category_name || 'Uncategorized'}
                  </p>

                  <h2 className="text-base font-semibold group-hover:underline">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-xl font-bold text-accent">
                    {formatPrice(product.price)}
                  </p>

                  <p className="mt-2 text-xs text-content-muted">
                    View product →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Product pages"
          className="mt-9 flex flex-wrap justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={paginationClass(false)}
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          ).map(number => (
            <button
              key={number}
              type="button"
              onClick={() => goToPage(number)}
              aria-current={
                number === currentPage ? 'page' : undefined
              }
              className={paginationClass(number === currentPage)}
            >
              {number}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={paginationClass(false)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}