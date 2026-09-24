import PointOfSale from '../pos/PointOfSale';

/** El empleado no puede registrar clientes nuevos: POST /api/users es exclusivo de admin. */
function EmployeePos() {
  return <PointOfSale canRegisterClient={false} />;
}

export default EmployeePos;
