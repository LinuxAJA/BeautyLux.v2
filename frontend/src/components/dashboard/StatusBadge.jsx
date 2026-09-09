import Badge from '../ui/Badge';

/** Activo / Inactivo, con el mismo componente Badge del catálogo. */
function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <Badge variant={isActive ? 'soft' : 'muted'} className={isActive ? 'text-primary' : ''}>
      {isActive ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}

export default StatusBadge;
