import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

/** Acceso a la bolsa de compras. Falla rápido si falta el provider. */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>.');
  }

  return context;
}

export default useCart;
