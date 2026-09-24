import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import PasswordInput from '../auth/PasswordInput';
import Select from '../ui/Select';
import useForm from '../../hooks/useForm';
import { documentTypes } from '../../data/documentTypes';
import { addressRule, emailRule, getDocumentNumberRule, nameRule, passwordRule, phoneRule } from '../../utils/validators';

const EMPTY_VALUES = {
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  address: '',
  phone: '',
  email: '',
  password: '',
};

/**
 * Alta rápida de un cliente desde el punto de venta.
 *
 * Es una versión reducida de `UserFormModal`: sin selector de rol (siempre
 * `client`, y nunca se ofrece cambiarlo desde una venta) y pensada para
 * llenarse en segundos mientras alguien espera en el mostrador.
 */
function QuickClientModal({ isOpen, onClose, onCreated }) {
  const [serverError, setServerError] = useState(null);

  const buildSchema = (values) => {
    const documentRule = getDocumentNumberRule(values.documentType);
    return {
      firstName: nameRule('Nombre'),
      lastName: nameRule('Apellido'),
      documentType: {
        label: 'Tipo de documento',
        required: true,
        messages: { required: 'Selecciona un tipo de documento.' },
      },
      documentNumber: {
        label: 'Número de documento',
        required: true,
        minLength: documentRule.minLength,
        maxLength: documentRule.maxLength,
        pattern: documentRule.pattern,
        sanitize: documentRule.sanitize,
        messages: {
          required: 'El número de documento es obligatorio.',
          minLength: documentRule.lengthMessage,
          maxLength: documentRule.lengthMessage,
          pattern: documentRule.patternMessage,
        },
      },
      address: addressRule,
      phone: phoneRule,
      email: emailRule,
      password: passwordRule,
    };
  };

  const { isSubmitting, getFieldProps, handleSubmit, reset } = useForm(EMPTY_VALUES, buildSchema);

  useEffect(() => {
    if (isOpen) {
      reset(EMPTY_VALUES);
      setServerError(null);
    }
  }, [isOpen, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      const client = await onCreated({ ...data, role: 'client' });
      // Solo se cierra si `onCreated` no lanzó: deja ver el error si el
      // correo ya existe, en vez de perder lo que la persona ya escribió.
      if (client) onClose();
    } catch (error) {
      setServerError(error.message ?? 'No se pudo registrar el cliente.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo cliente" size="md">
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        {serverError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" {...getFieldProps('firstName')} />
          <Input label="Apellido" {...getFieldProps('lastName')} />
          <Select label="Tipo de documento" options={documentTypes} {...getFieldProps('documentType')} />
          <Input label="Número de documento" {...getFieldProps('documentNumber')} />
          <Input label="Dirección" containerClassName="sm:col-span-2" {...getFieldProps('address')} />
          <Input label="Teléfono" {...getFieldProps('phone')} />
          <Input label="Correo electrónico" type="email" {...getFieldProps('email')} />
          <PasswordInput label="Contraseña" containerClassName="sm:col-span-2" {...getFieldProps('password')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            Crear cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default QuickClientModal;
