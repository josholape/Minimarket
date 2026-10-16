import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refreshCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/cart');
      setItems(res.data.cart);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // Load the cart when the app opens or when the user logs in
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCart();
  }, [refreshCart]);

  // If logged out, the count is 0 no matter what is left in `items`
  const cartCount = user ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}