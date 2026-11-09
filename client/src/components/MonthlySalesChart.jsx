import { useState } from 'react';
import { formatPrice } from '../utils/currency';

export default function MonthlySalesChart({ months }) {
  const [selectedMonth, setSelectedMonth] = useState(
    months[months.length - 1]?.month || ''
  );

  if (months.length === 0) {
    return (
      <p className="text-sm text-content-muted">
        Monthly analytics are unavailable.
      </p>
    );
  }

  const selected =
    months.find(month => month.month === selectedMonth) ||
    months[months.length - 1];

  const highestValue = Math.max(
    ...months.map(month => month.orderValue),
    1
  );

  const averageOrder =
    selected.orders > 0
      ? selected.orderValue / selected.orders
      : 0;

  return (
    <section
      aria-labelledby="monthly-chart-title"
      className="mb-8 rounded-2xl border border-outline bg-surface-card p-5 shadow-sm sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="monthly-chart-title"
            className="text-xl font-bold"
          >
            Monthly order value
          </h2>

          <p className="mt-2 text-sm text-content-muted">
            Last 12 months · cancelled orders excluded
          </p>
        </div>

        <span className="rounded-full bg-surface-input px-3 py-1.5 text-xs font-semibold text-accent">
          PHP
        </span>
      </header>

      {/* Selected month summary */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-6 rounded-xl bg-surface-input p-4"
      >
        <p className="text-sm font-semibold text-accent">
          {selected.label}
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-content-muted">
              Order value
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatPrice(selected.orderValue)}
            </p>
          </div>

          <div>
            <p className="text-xs text-content-muted">
              Orders
            </p>

            <p className="mt-1 text-2xl font-bold">
              {selected.orders}
            </p>
          </div>

          <div>
            <p className="text-xs text-content-muted">
              Average order
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatPrice(averageOrder)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs text-content-muted">
        Select a month to view its totals.
      </p>

      {/* Horizontal scrolling keeps the graph usable on phones. */}
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="min-w-[600px]">
          <div className="mb-2 flex justify-between text-xs text-content-muted">
            <span>Order value</span>
            <span>
              Highest month: {formatPrice(highestValue === 1 &&
                months.every(month => month.orderValue === 0)
                  ? 0
                  : Math.max(...months.map(month => month.orderValue))
              )}
            </span>
          </div>

          <div className="flex h-56 gap-2 border-b border-outline">
            {months.map(month => {
              const height =
                (month.orderValue / highestValue) * 100;

              const active =
                month.month === selected.month;

              return (
                <button
                  key={month.month}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${month.label}: ${formatPrice(
                    month.orderValue
                  )}, ${month.orders} orders`}
                  title={`${month.label}: ${formatPrice(
                    month.orderValue
                  )}`}
                  onClick={() => setSelectedMonth(month.month)}
                  className="group flex h-full min-w-0 flex-1 items-end rounded-t-lg px-1 focus-visible:outline-offset-0"
                >
                  <span
                    aria-hidden="true"
                    style={{ height: `${height}%` }}
                    className={`block w-full rounded-t-lg transition-colors ${
                      active
                        ? 'bg-brand-600'
                        : 'bg-accent opacity-60 group-hover:opacity-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            {months.map(month => (
              <span
                key={month.month}
                className={`min-w-0 flex-1 text-center text-xs ${
                  month.month === selected.month
                    ? 'font-bold text-accent'
                    : 'text-content-muted'
                }`}
              >
                {month.shortLabel}
              </span>
            ))}
          </div>

          <div className="mt-3 flex justify-between text-xs text-content-muted">
            <span>{months[0].label}</span>
            <span>{months[months.length - 1].label}</span>
          </div>
        </div>
      </div>

      {/* Exact figures are also available without interpreting bars. */}
      <details className="mt-5 border-t border-outline pt-4">
        <summary className="cursor-pointer rounded text-sm font-semibold text-accent">
          View monthly figures
        </summary>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-input">
              <tr>
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3">Orders</th>
                <th scope="col" className="p-3">Order value</th>
              </tr>
            </thead>

            <tbody>
              {months.map(month => (
                <tr
                  key={month.month}
                  className="border-t border-outline"
                >
                  <td className="p-3">{month.label}</td>
                  <td className="p-3">{month.orders}</td>
                  <td className="p-3 font-semibold">
                    {formatPrice(month.orderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-4 text-xs leading-5 text-content-muted">
        Based on when orders were created. Order value includes
        pending, shipped, and completed orders; it is not a record
        of payments collected.
      </p>
    </section>
  );
}