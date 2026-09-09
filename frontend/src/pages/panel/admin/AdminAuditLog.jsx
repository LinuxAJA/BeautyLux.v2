import DataTable from '../../../components/dashboard/DataTable';
import { useApi } from '../../../hooks/useApi';
import * as metaService from '../../../services/meta.service';

const ACTION_LABELS = {
  user_registered: 'Registro de usuario',
  login_succeeded: 'Inicio de sesión',
  login_failed: 'Intento de inicio de sesión fallido',
  password_changed: 'Cambio de contraseña',
  password_reset_requested: 'Solicitud de recuperación',
  password_reset_completed: 'Recuperación completada',
  user_created: 'Usuario creado',
  user_updated: 'Usuario actualizado',
  user_status_changed: 'Estado de usuario cambiado',
  user_deleted: 'Usuario eliminado',
  product_created: 'Producto creado',
  product_updated: 'Producto actualizado',
  product_status_changed: 'Estado de producto cambiado',
  product_deleted: 'Producto eliminado',
  service_created: 'Servicio creado',
  service_updated: 'Servicio actualizado',
  service_status_changed: 'Estado de servicio cambiado',
  service_deleted: 'Servicio eliminado',
  category_created: 'Categoría creada',
  category_updated: 'Categoría actualizada',
  category_deleted: 'Categoría eliminada',
  refresh_token_reuse_detected: 'Actividad sospechosa detectada',
};

function AdminAuditLog() {
  const { data, isLoading, error } = useApi(() => metaService.getAuditLogs({ perPage: 50 }), []);

  const columns = [
    { key: 'createdAt', header: 'Fecha', render: (row) => new Date(row.createdAt).toLocaleString('es-CO') },
    { key: 'userName', header: 'Usuario', render: (row) => row.userName ?? 'Sistema' },
    { key: 'action', header: 'Acción', render: (row) => ACTION_LABELS[row.action] ?? row.action },
    { key: 'entity', header: 'Entidad' },
    { key: 'ipAddress', header: 'IP' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Bitácora de auditoría</h1>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} error={error} emptyMessage="Sin eventos registrados." />
    </div>
  );
}

export default AdminAuditLog;
