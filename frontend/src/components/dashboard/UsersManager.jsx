import { useMemo, useState } from 'react';
import { Pencil, Plus, PowerOff, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import UserFormModal from './UserFormModal';
import { useApi } from '../../hooks/useApi';
import * as usersService from '../../services/users.service';

/**
 * Administra usuarios. El admin ve y gestiona todos los roles; el
 * empleado (canManageRoles=false, canDelete=false, roleFilter='client')
 * solo ve y edita clientes — el backend refuerza esta misma restricción.
 */
function UsersManager({ roleFilter, canCreate = true, canDelete = true, canChangeStatus = true, canChangeRole = true, title }) {
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState(undefined); // undefined = cerrado, null = crear, objeto = editar
  const [pendingAction, setPendingAction] = useState(null); // { type: 'delete'|'status', user }
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () => usersService.listUsers({ search, role: roleFilter, perPage: 50 }),
    [search, roleFilter],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleCreateOrUpdate = async (formValues) => {
    if (modalUser) {
      await usersService.updateUser(modalUser.id, formValues);
    } else {
      await usersService.createUser(formValues);
    }
    await refetch();
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsActing(true);
    try {
      if (pendingAction.type === 'delete') {
        await usersService.deleteUser(pendingAction.user.id);
      } else {
        await usersService.updateUserStatus(pendingAction.user.id, pendingAction.nextStatus);
      }
      await refetch();
      setPendingAction(null);
    } finally {
      setIsActing(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Nombre', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', header: 'Correo' },
    { key: 'document', header: 'Documento', render: (row) => `${row.documentType} ${row.documentNumber}` },
    { key: 'phone', header: 'Teléfono' },
    { key: 'role', header: 'Rol', render: (row) => row.role.label },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setModalUser(row)}>
            <Pencil className="size-4" />
          </Button>
          {canChangeStatus && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cambiar estado"
              onClick={() =>
                setPendingAction({
                  type: 'status',
                  user: row,
                  nextStatus: row.status === 'active' ? 'inactive' : 'active',
                })
              }
            >
              <PowerOff className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => setPendingAction({ type: 'delete', user: row })}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">{title}</h1>
        {canCreate && (
          <Button variant="gradient" onClick={() => setModalUser(null)}>
            <Plus />
            Agregar usuario
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, correo o documento..."
        emptyMessage="No hay usuarios para mostrar."
      />

      <UserFormModal
        isOpen={modalUser !== undefined}
        onClose={() => setModalUser(undefined)}
        onSubmit={handleCreateOrUpdate}
        initialUser={modalUser}
        canChangeRole={canChangeRole}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
        isLoading={isActing}
        title={pendingAction?.type === 'delete' ? 'Eliminar usuario' : 'Cambiar estado'}
        confirmLabel={pendingAction?.type === 'delete' ? 'Eliminar' : 'Confirmar'}
        description={
          pendingAction?.type === 'delete'
            ? `¿Eliminar a ${pendingAction?.user.firstName} ${pendingAction?.user.lastName}? Esta acción se puede revertir solo desde la base de datos.`
            : `¿Cambiar el estado de ${pendingAction?.user.firstName} a "${pendingAction?.nextStatus === 'active' ? 'Activo' : 'Inactivo'}"?`
        }
      />
    </div>
  );
}

export default UsersManager;
