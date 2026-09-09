import { Navigate } from 'react-router';

import { useAuth } from '../../hooks/useAuth';

const ROUTE_BY_ROLE = {
  admin: '/panel/admin',
  employee: '/panel/empleado',
  client: '/panel/cliente',
};

/** /panel redirige al panel correspondiente según el rol del usuario autenticado. */
function PanelRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROUTE_BY_ROLE[user.role.name] ?? '/'} replace />;
}

export default PanelRedirect;
