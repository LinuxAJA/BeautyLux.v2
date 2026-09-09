import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import PasswordInput from '../auth/PasswordInput';
import Select from '../ui/Select';
import useForm from '../../hooks/useForm';
import { documentTypes } from '../../data/documentTypes';
import {
  addressRule,
  emailRule,
  getDocumentNumberRule,
  nameRule,
  passwordRule,
  phoneRule,
} from '../../utils/validators';

const ROLE_OPTIONS = [
  { value: 'client', label: 'Cliente' },
  { value: 'employee', label: 'Empleado' },
  { value: 'admin', label: 'Administrador' },
];

const EMPTY_VALUES = {
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  role: 'client',
};

/**
 * Crea o edita un usuario. En edición, la contraseña no se solicita
 * (el cambio de contraseña es un flujo aparte del propio usuario).
 */
function UserFormModal({ isOpen, onClose, onSubmit, initialUser, canChangeRole = true }) {
  const isEdit = Boolean(initialUser);
  const [serverError, setServerError] = useState(null);

  const buildSchema = (values) => ({
    firstName: nameRule('Nombre'),
    lastName: nameRule('Apellido'),
    documentType: { label: 'Tipo de documento', required: true },
    documentNumber: { ...getDocumentNumberRule(values.documentType), label: 'Número de documento', required: true },
    address: addressRule,
    phone: phoneRule,
    email: emailRule,
    ...(isEdit ? {} : { password: passwordRule }),
  });

  const { values, isSubmitting, getFieldProps, handleChange, handleSubmit, reset } = useForm(
    EMPTY_VALUES,
    buildSchema,
  );

  useEffect(() => {
    if (isOpen) {
      reset(initialUser ? { ...EMPTY_VALUES, ...initialUser, password: '' } : EMPTY_VALUES);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialUser]);

  const onFormSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      setServerError(error.message ?? 'No se pudo guardar el usuario.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar usuario' : 'Agregar usuario'} size="lg">
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        {serverError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" {...getFieldProps('firstName')} />
          <Input label="Apellido" {...getFieldProps('lastName')} />

          <Select
            label="Tipo de documento"
            options={documentTypes}
            {...getFieldProps('documentType')}
          />
          <Input label="Número de documento" {...getFieldProps('documentNumber')} />

          <Input label="Dirección" containerClassName="sm:col-span-2" {...getFieldProps('address')} />
          <Input label="Teléfono" {...getFieldProps('phone')} />
          <Input label="Correo electrónico" type="email" {...getFieldProps('email')} disabled={isEdit} />

          {!isEdit && <PasswordInput label="Contraseña" {...getFieldProps('password')} />}

          {canChangeRole && (
            <Select
              label="Rol"
              options={ROLE_OPTIONS}
              value={values.role}
              onChange={handleChange}
              name="role"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UserFormModal;
