import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tartila_cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tartila_cart', JSON.stringify(items));
  }, [items]);

  function addItem(item) {
    const cartId = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...item, cartId }]);
    return cartId;
  }

  function removeItem(cartId) {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
