import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../../hooks/useAuth';

/** Exige que el usuario autenticado tenga uno de los roles permitidos. */
function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!allow.includes(user.role.name)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
