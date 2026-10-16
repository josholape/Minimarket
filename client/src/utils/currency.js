const CURRENCY = 'PHP';
const LOCALE = 'en-PH';

export function formatPrice(amount) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
  }).format(Number(amount));
}