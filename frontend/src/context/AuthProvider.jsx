import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthContext } from './AuthContext';
import { ApiError } from '../services/api';
import * as authService from '../services/auth.service';

/**
 * Maneja la sesión del usuario contra la API real.
 *
 * El access token vive en memoria (dentro de `services/api.js`) y nunca en
 * localStorage. Al montar la aplicación se intenta renovar la sesión con
 * `/auth/refresh`, que se apoya en la cookie httpOnly emitida por el
 * backend — así la sesión sobrevive a un F5 sin exponer el token al JS.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        await authService.refreshSession();
        const profile = await authService.me();
        if (!cancelled) {
          const { permissions: perms, ...publicUser } = profile.data;
          setUser(publicUser);
          setPermissions(perms ?? []);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data);
      return { ok: true, user: response.data };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, error: error.message, fieldErrors: error.errors };
      return { ok: false, error: 'No se pudo completar el registro. Inténtalo de nuevo.' };
    }
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    try {
      const { user: loggedUser } = await authService.login(email, password, remember);
      const profile = await authService.me();
      const { permissions: perms, ...publicUser } = profile.data;
      setUser(publicUser);
      setPermissions(perms ?? []);
      void loggedUser;
      return { ok: true, user: publicUser };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, error: error.message };
      return { ok: false, error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    setUser(null);
    setPermissions([]);
  }, []);

  const can = useCallback((permissionCode) => permissions.includes(permissionCode), [permissions]);

  /** Vuelve a pedir /auth/me: usado tras editar el perfil o cambiar la contraseña. */
  const refreshProfile = useCallback(async () => {
    const profile = await authService.me();
    const { permissions: perms, ...publicUser } = profile.data;
    setUser(publicUser);
    setPermissions(perms ?? []);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      permissions,
      can,
      register,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, permissions, can, register, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
