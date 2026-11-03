function Stars({ value = 0, onChange, className = 'text-xl' }) {
  return (
    <span className={`inline-flex ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const color = n <= Math.round(value) ? 'text-yellow-500' : 'text-gray-300';

        return onChange ? (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={`${color} hover:text-yellow-400`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={color}>★</span>
        );
      })}
    </span>
  );
}

export default Stars;