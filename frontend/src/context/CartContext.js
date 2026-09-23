import { createContext } from 'react';

/**
 * Contexto de la bolsa de compras.
 *
 * Vive en su propio archivo (sin JSX) para que `CartProvider.jsx` solo exporte
 * componentes y Fast Refresh siga funcionando durante el desarrollo, igual que
 * `AuthContext.js`.
 */
export const CartContext = createContext(null);

export default CartContext;
