import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddressForm from './AddressForm.jsx';
import { formatPrice } from '../utils/currency';

export default function BuyNowPanel({ product, quantity, user, onCancel }) {
  const navigate = useNavigate();
  async function placeOrder(shipping) {
    const response = await api.post('/orders/buy-now', { product_id: product.id, quantity, shipping });
    navigate('/orders/' + response.data.order.id);
  }
  return (
    <section aria-labelledby="buy-now-title" className="mt-6 rounded-2xl border border-outline bg-surface-card p-5">
      <h2 id="buy-now-title" className="text-xl font-bold">Review your purchase</h2>
      <div className="my-4 rounded-xl bg-surface-input p-4">
        <p className="font-semibold">{product.name}</p>
        <p className="mt-1 text-sm text-content-muted">Quantity: {quantity}</p>
        <p className="mt-2 text-lg font-bold text-accent">{formatPrice(Number(product.price) * quantity)}</p>
      </div>
      <p className="mb-4 text-sm text-content-muted">Enter a delivery address for this order. It is not saved to your address book. Items already in your cart stay there. No payment is collected here.</p>
      <AddressForm initial={{ name: user.name }} onSubmit={placeOrder} onCancel={onCancel} submitLabel="Place order" showDefault={false} />
    </section>
  );
}
