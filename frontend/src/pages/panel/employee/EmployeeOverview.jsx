import { useAuth } from '../../../hooks/useAuth';

function EmployeeOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-2">
      <h1 className="font-serif text-2xl font-semibold">Hola, {user.firstName}</h1>
      <p className="text-sm text-muted-foreground">
        Desde aquí puedes consultar y editar clientes, y gestionar el catálogo de productos y servicios.
        Los cambios de estado, la eliminación de cuentas y la bitácora son exclusivos del administrador.
      </p>
    </div>
  );
}

export default EmployeeOverview;
