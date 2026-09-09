import UsersManager from '../../../components/dashboard/UsersManager';

function AdminUsers() {
  return <UsersManager title="Usuarios" canCreate canDelete canChangeStatus canChangeRole />;
}

export default AdminUsers;
