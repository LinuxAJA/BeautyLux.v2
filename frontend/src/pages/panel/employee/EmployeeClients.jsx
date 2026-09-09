import UsersManager from '../../../components/dashboard/UsersManager';

/** El empleado solo ve y edita clientes; el backend refuerza esta misma restricción. */
function EmployeeClients() {
  return (
    <UsersManager
      title="Clientes"
      roleFilter="client"
      canCreate={false}
      canDelete={false}
      canChangeStatus={false}
      canChangeRole={false}
    />
  );
}

export default EmployeeClients;
