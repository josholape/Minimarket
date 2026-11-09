import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/currency';
import AddressForm from '../components/AddressForm';

function Cart() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  const [showCheckout, setShowCheckout] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);

  async function loadCart() {
    try {
      const res = await api.get('/cart');
      setItems(res.data.cart);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load cart', isError: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadCart();
  }, [user]);

  async function updateQuantity(id, quantity) {
    if (quantity < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity });
      loadCart();
      refreshCart();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not update quantity',
        isError: true,
      });
    }
  }

  async function removeItem(id) {
    try {
      await api.delete(`/cart/${id}`);
      loadCart();
      refreshCart();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not remove item',
        isError: true,
      });
    }
  }

  // Open the checkout panel: load saved addresses and preselect the default
  async function openCheckout() {
    setMessage({ text: '', isError: false });
    try {
      const res = await api.get('/addresses');
      const list = res.data.addresses;
      const preferred = list.find((a) => a.is_default) || list[0];
      setAddresses(list);
      setSelectedId(preferred ? preferred.id : null);
      setAddingAddress(list.length === 0);
      setShowCheckout(true);
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Could not load your addresses',
        isError: true,
      });
    }
  }

  // Save a new address to the address book and select it (throws so the form shows errors)
  async function saveNewAddress(values) {
    const res = await api.post('/addresses', values);
    const listRes = await api.get('/addresses');
    setAddresses(listRes.data.addresses);
    setSelectedId(res.data.address.id);
    setAddingAddress(false);
  }

  function cancelAddressForm() {
    if (addresses.length === 0) {
      setShowCheckout(false); // nothing to choose from, so close checkout
    } else {
      setAddingAddress(false);
    }
  }

  async function placeOrder() {
    const chosen = addresses.find((a) => a.id === selectedId);
    if (!chosen) {
      setMessage({ text: 'Please choose a shipping address', isError: true });
      return;
    }

    setMessage({ text: '', isError: false });
    setPlacing(true);
    try {
      // The order keeps its own copy of the address, so later edits don't change it
      const res = await api.post('/orders/checkout', {
        shipping: {
          name: chosen.name,
          phone: chosen.phone,
          address: chosen.address,
          city: chosen.city,
          province: chosen.province,
          postal_code: chosen.postal_code,
        },
      });
      setItems([]);
      setShowCheckout(false);
      refreshCart();
      setMessage({
        text: `Order #${res.data.order.id} placed! Total: ${formatPrice(res.data.order.total_amount)}`,
        isError: false,
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Checkout failed',
        isError: true,
      });
    } finally {
      setPlacing(false);
    }
  }

  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  if (!user) {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-lg items-center justify-center px-4 py-12">
      <section
        aria-labelledby="cart-signin-title"
        className="w-full rounded-2xl border border-outline bg-surface-card p-8 text-center shadow-sm sm:p-10"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-input text-accent">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
          >
            <path d="M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" />
            <circle cx="10" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
          </svg>
        </div>

        <h1
          id="cart-signin-title"
          className="text-2xl font-bold text-content-main"
        >
          Your cart awaits
        </h1>

        <p className="mt-3 text-content-muted">
          Sign in to view your items.
        </p>

        <Link
          to="/login"
          className="mt-7 block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Sign in
        </Link>

        <Link
          to="/"
          className="mt-4 inline-block rounded text-sm font-medium text-accent hover:underline"
        >
          Continue shopping
        </Link>
      </section>
    </main>
  );
}

  if (loading) return <p className="text-center mt-10">Loading cart...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {message.text && (
        <p className={`mb-4 text-sm ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border rounded p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-gray-500 text-sm">{formatPrice(item.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="border rounded px-2"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="border rounded px-2"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-sm ml-4 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-xl font-bold">Total: {formatPrice(total)}</p>
            {!showCheckout && (
              <button
                onClick={openCheckout}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Checkout
              </button>
            )}
          </div>

          {showCheckout && (
            <div className="border rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Delivery address</h2>
                <Link to="/account" className="text-sm text-blue-600 hover:underline">
                  Manage addresses
                </Link>
              </div>

              {addingAddress ? (
                <AddressForm
                  initial={{ name: user.name }}
                  onSubmit={saveNewAddress}
                  onCancel={cancelAddressForm}
                  submitLabel="Save and use this address"
                />
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 border rounded p-3 cursor-pointer ${
                          selectedId === a.id ? 'border-blue-600 bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedId === a.id}
                          onChange={() => setSelectedId(a.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold">
                            {a.name} <span className="text-gray-400 font-normal">| {a.phone}</span>
                          </p>
                          <p className="text-sm text-gray-600">{a.address}</p>
                          <p className="text-sm text-gray-600">
                            {a.city}, {a.province} {a.postal_code}
                          </p>
                          {a.is_default && (
                            <span className="inline-block mt-1 text-xs border border-blue-600 text-blue-600 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setAddingAddress(true)}
                    className="text-blue-600 text-sm hover:underline mb-4"
                  >
                    + Add new address
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={placeOrder}
                      disabled={placing}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {placing ? 'Placing order...' : `Place order (${formatPrice(total)})`}
                    </button>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="border px-6 py-2 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Cart;