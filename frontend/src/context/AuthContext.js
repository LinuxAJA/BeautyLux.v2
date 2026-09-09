import { createContext } from 'react';

/**
 * Contexto de autenticación.
 *
 * Vive en su propio archivo (sin JSX) para que `AuthProvider.jsx` solo
 * exporte componentes y Fast Refresh siga funcionando durante el desarrollo.
 */
export const AuthContext = createContext(null);

export default AuthContext;
