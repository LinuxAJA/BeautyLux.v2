import { useState } from 'react';
import { CircleAlert, CircleCheck, Mail, MapPin, Phone, UserRound } from 'lucide-react';

import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import PasswordInput from './PasswordInput';
import PasswordStrength from './PasswordStrength';
import Select from '../ui/Select';
import useForm from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { documentTypes } from '../../data/documentTypes';
import {
  addressRule,
  confirmPasswordRule,
  emailRule,
  getDocumentNumberRule,
  nameRule,
  passwordRule,
  phoneRule,
} from '../../utils/validators';

const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

/**
 * El esquema es una función porque la regla del número de documento depende
 * del tipo seleccionado: al cambiar de CC a Pasaporte cambian el formato,
 * la longitud permitida y los caracteres que se pueden teclear.
 */
function buildSchema(values) {
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
    confirmPassword: confirmPasswordRule,
    acceptTerms: {
      label: 'Términos y condiciones',
      required: true,
      messages: { required: 'Debes aceptar los términos y condiciones para continuar.' },
    },
  };
}

/**
 * Registro de clientes dentro de un Modal.
 * Se abre desde el inicio de sesión y puede cerrarse sin completar el registro.
 */
function RegisterModal({ isOpen, onClose, onRegistered }) {
  const [registerError, setRegisterError] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);
  const { register } = useAuth();

  const { values, errors, isSubmitting, getFieldProps, handleChange, handleSubmit, reset } =
    useForm(INITIAL_VALUES, buildSchema);

  const onSubmit = handleSubmit(async (data) => {
    setRegisterError(null);

    const result = await register(data);

    if (!result.ok) {
      setRegisterError(result.error);
      return;
    }

    setRegisteredUser(result.user);
  });

  /** Devuelve el modal a su estado inicial al cerrarlo. */
  const handleClose = () => {
    onClose();
    setRegisterError(null);
    setRegisteredUser(null);
    reset();
  };

  const handleGoToLogin = () => {
    const email = registeredUser.email;
    handleClose();
    onRegistered?.(email);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={registeredUser ? '¡Registro completado!' : 'Crear una cuenta'}
      description={
        registeredUser
          ? undefined
          : 'Completa tus datos para unirte a BeautyLux. Los campos marcados con * son obligatorios.'
      }
    >
      {registeredUser ? (
        <div className="space-y-5 py-4 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
            <CircleCheck className="size-8 text-success" aria-hidden="true" />
          </span>

          <div>
            <p className="font-serif text-xl font-semibold">
              Bienvenida, {registeredUser.firstName}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tu cuenta se creó correctamente con el correo{' '}
              <strong className="font-medium text-foreground">{registeredUser.email}</strong>.
              Ya puedes iniciar sesión y disfrutar tu 15% de descuento de bienvenida.
            </p>
          </div>

          <Button variant="gradient" size="lg" fullWidth onClick={handleGoToLogin}>
            Ir a iniciar sesión
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {registerError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {registerError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              icon={UserRound}
              placeholder="Camila"
              autoComplete="given-name"
              showCounter
              {...getFieldProps('firstName')}
            />

            <Input
              label="Apellido"
              icon={UserRound}
              placeholder="Bermúdez"
              autoComplete="family-name"
              showCounter
              {...getFieldProps('lastName')}
            />

            <Select
              label="Tipo de documento"
              options={documentTypes}
              placeholder="Selecciona el tipo"
              {...getFieldProps('documentType')}
            />

            <Input
              label="Número de documento"
              inputMode={values.documentType === 'PA' ? 'text' : 'numeric'}
              placeholder={values.documentType === 'PA' ? 'AB123456' : '1023456789'}
              showCounter
              {...getFieldProps('documentNumber')}
            />

            <Input
              label="Teléfono"
              icon={Phone}
              inputMode="numeric"
              placeholder="3204567890"
              autoComplete="tel"
              hint="Celular colombiano de 10 dígitos"
              showCounter
              {...getFieldProps('phone')}
            />

            <Input
              label="Correo electrónico"
              type="email"
              icon={Mail}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              {...getFieldProps('email')}
            />

            <Input
              label="Dirección"
              icon={MapPin}
              placeholder="Calle 45 #23-18, Bogotá"
              autoComplete="street-address"
              containerClassName="sm:col-span-2"
              showCounter
              {...getFieldProps('address')}
            />

            <div>
              <PasswordInput
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                {...getFieldProps('password')}
              />
              <PasswordStrength password={values.password} />
            </div>

            <PasswordInput
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              {...getFieldProps('confirmPassword')}
            />
          </div>

          <Checkbox
            name="acceptTerms"
            checked={values.acceptTerms}
            onChange={handleChange}
            error={errors.acceptTerms}
            label="Acepto los términos y condiciones y la política de tratamiento de datos personales."
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {/* Activo siempre: al pulsarlo con datos incompletos, `handleSubmit`
                marca todos los campos y muestra cada mensaje de error. */}
            <Button type="submit" variant="gradient" isLoading={isSubmitting} className="sm:min-w-44">
              Crear cuenta
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default RegisterModal;
