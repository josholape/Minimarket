import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 8;
const LOW_STOCK_THRESHOLD = 5;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

export default function Home() {
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = params.get('q') || '';
  const category = params.get('category') || '';
  const requestedSort = params.get('sort') || 'newest';

  const sort = SORT_OPTIONS.some(
    option => option.value === requestedSort
  )
    ? requestedSort
    : 'newest';

  const requestedPage = Number(params.get('page') || 1);

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await api.get('/products');

        if (!Array.isArray(response.data.products)) {
          throw new Error('Unexpected product response');
        }

        if (active) {
          setProducts(response.data.products);
        }
      } catch {
        if (active) {
          setError(
            'Could not load products. Make sure the backend is running, then refresh.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = products.filter(product => {
      const matchesCategory =
        !category || product.category_name === category;

      const matchesSearch = String(product.name || '')
        .toLowerCase()
        .includes(term);

      return matchesCategory && matchesSearch;
    });

    result.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);

        case 'price-desc':
          return Number(b.price) - Number(a.price);

        case 'name-asc':
          return String(a.name || '').localeCompare(
            String(b.name || '')
          );

        default:
          return Number(b.id) - Number(a.id);
      }
    });

    return result;
  }, [products, search, category, sort]);

  const totalProducts = filteredProducts.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const pageProducts = filteredProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  let resultLabel = 'No products found';

  if (totalProducts > 0) {
    resultLabel =
      totalPages > 1
        ? `${startIndex + 1}–${
            startIndex + pageProducts.length
          } of ${totalProducts} products`
        : `${totalProducts} ${
            totalProducts === 1 ? 'product' : 'products'
          }`;
  }

  function changeSort(value) {
    const next = new URLSearchParams(params);

    next.set('sort', value);
    next.delete('page');

    setParams(next);
  }

  function goToPage(number) {
    const next = new URLSearchParams(params);

    next.set('page', String(number));
    setParams(next);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function pageButtonClass(active) {
    return `min-h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-outline bg-surface-card text-content-main enabled:hover:border-accent'
    }`;
  }

  if (loading) {
    return (
      <p
        role="status"
        className="p-12 text-center text-content-muted"
      >
        Loading products…
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p
          role="alert"
          className="rounded-xl bg-red-100 p-4 text-sm text-red-900"
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-content-main">
      {/* Heading and sorting */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {search
              ? `Results for “${search}”`
              : category || 'Products'}
          </h1>

          {(search || category) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {search && category && (
                <span className="text-content-muted">
                  In {category}
                </span>
              )}

              <Link
                to="/"
                className="rounded font-semibold text-accent hover:underline"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="product-sort"
            className="text-sm text-content-muted"
          >
            Sort:
          </label>

          <div className="relative">
            <select
              id="product-sort"
              value={sort}
              onChange={event =>
                changeSort(event.target.value)
              }
              className="h-10 w-48 appearance-none rounded-lg border border-outline bg-surface-card py-2 pl-3 pr-9 text-sm font-medium text-content-main"
            >
              {SORT_OPTIONS.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </header>

      {/* Product cards */}
      {pageProducts.length === 0 ? (
        <section className="rounded-2xl border border-outline bg-surface-card p-10 text-center">
          <h2 className="text-xl font-semibold">
            No matches this time
          </h2>

          <p className="mt-2 text-content-muted">
            Try another search or browse all products.
          </p>

          <Link
            to="/"
            className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Browse all products
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pageProducts.map(product => {
            const stock = Number(product.stock);
            const outOfStock = stock <= 0;

            const lowStock =
              !outOfStock &&
              stock <= LOW_STOCK_THRESHOLD;

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-outline bg-surface-card p-3 shadow-sm transition-colors hover:border-accent"
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
                    <span className="absolute left-2 top-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                      Only {stock} left
                    </span>
                  )}
                </div>

                <div className="px-1 pb-2 pt-4">
                  <p className="text-xs font-medium text-content-muted">
                    {product.category_name || 'Uncategorized'}
                  </p>

                  <h2 className="mt-1 font-semibold group-hover:underline">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-xl font-bold text-accent">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Result count below the cards */}
      <p
        role="status"
        className="mt-6 text-center text-sm font-medium text-content-muted"
      >
        {resultLabel}
      </p>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Product pages"
          className="mt-4 flex flex-wrap justify-center gap-2"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            className={pageButtonClass(false)}
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
                number === currentPage
                  ? 'page'
                  : undefined
              }
              className={pageButtonClass(
                number === currentPage
              )}
            >
              {number}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className={pageButtonClass(false)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}