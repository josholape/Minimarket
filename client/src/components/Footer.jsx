import ThemeToggle from './ThemeToggle.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-outline bg-surface-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div>
          <p className="font-semibold text-content-main">
            MiniMarket
          </p>

          <p className="mt-1 text-sm text-content-muted">
            Your everyday marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-content-muted">
            Appearance
          </span>

          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}