import { useState } from 'react';
import { CheckCircle, CircleAlert } from 'lucide-react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PasswordInput from '../../../components/auth/PasswordInput';
import { useAuth } from '../../../hooks/useAuth';
import useForm from '../../../hooks/useForm';
import * as authService from '../../../services/auth.service';
import { addressRule, passwordRule, phoneRule } from '../../../utils/validators';

const profileSchema = { address: addressRule, phone: phoneRule };

const passwordSchema = {
  currentPassword: { label: 'Contraseña actual', required: true, messages: { required: 'Ingresa tu contraseña actual.' } },
  newPassword: passwordRule,
  confirmNewPassword: {
    label: 'Confirmar contraseña',
    required: true,
    match: 'newPassword',
    messages: { required: 'Debes confirmar la nueva contraseña.', match: 'Las contraseñas no coinciden.' },
  },
};

function ClientDashboard() {
  const { user, refreshProfile } = useAuth();
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const profileForm = useForm(
    { firstName: user.firstName, lastName: user.lastName, address: user.address, phone: user.phone },
    profileSchema,
  );

  const passwordForm = useForm(
    { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    passwordSchema,
  );

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    setProfileMessage(null);
    try {
      await authService.updateProfile({ address: data.address, phone: data.phone });
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message ?? 'No se pudo actualizar el perfil.' });
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    setPasswordMessage(null);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });
      passwordForm.reset();
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message ?? 'No se pudo cambiar la contraseña.' });
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Bienvenida, {user.firstName}. Aquí puedes actualizar tus datos.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-serif text-lg font-semibold">Datos personales</h2>

        {profileMessage && (
          <p
            role="alert"
            className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
              profileMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            {profileMessage.text}
          </p>
        )}

        <form onSubmit={onProfileSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" value={user.firstName} disabled />
            <Input label="Apellido" value={user.lastName} disabled />
          </div>
          <Input label="Correo electrónico" value={user.email} disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dirección" {...profileForm.getFieldProps('address')} />
            <Input label="Teléfono" {...profileForm.getFieldProps('phone')} />
          </div>
          <Button type="submit" variant="gradient" isLoading={profileForm.isSubmitting}>
            Guardar cambios
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-serif text-lg font-semibold">Cambiar contraseña</h2>

        {passwordMessage && (
          <p
            role="alert"
            className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
              passwordMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            {passwordMessage.text}
          </p>
        )}

        <form onSubmit={onPasswordSubmit} noValidate className="space-y-4">
          <PasswordInput label="Contraseña actual" {...passwordForm.getFieldProps('currentPassword')} />
          <PasswordInput label="Nueva contraseña" {...passwordForm.getFieldProps('newPassword')} />
          <PasswordInput label="Confirmar nueva contraseña" {...passwordForm.getFieldProps('confirmNewPassword')} />
          <Button type="submit" variant="outline" isLoading={passwordForm.isSubmitting}>
            Actualizar contraseña
          </Button>
        </form>
      </section>
    </div>
  );
}

export default ClientDashboard;
