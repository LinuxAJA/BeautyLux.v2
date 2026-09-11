import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import useForm from '../../hooks/useForm';
import { descriptionRule, imageUrlRule } from '../../utils/validators';

const TYPE_OPTIONS = [
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' },
];

const EMPTY_VALUES = { name: '', description: '', imageUrl: '', type: 'product' };

const schema = {
  name: { label: 'Nombre', required: true, minLength: 2, maxLength: 80, messages: { required: 'El nombre es obligatorio.' } },
  // 255 y no 300: coincide con la columna categories.description (VARCHAR(255)) en ambos backends.
  description: descriptionRule(255),
  imageUrl: imageUrlRule,
};

function CategoryFormModal({ isOpen, onClose, onSubmit, initialCategory }) {
  const isEdit = Boolean(initialCategory);
  const [serverError, setServerError] = useState(null);

  const { values, isSubmitting, getFieldProps, handleChange, handleSubmit, reset } = useForm(
    EMPTY_VALUES,
    schema,
  );

  useEffect(() => {
    if (isOpen) {
      reset(
        initialCategory
          ? {
              name: initialCategory.name,
              description: initialCategory.description ?? '',
              imageUrl: initialCategory.imageUrl ?? '',
              type: initialCategory.type,
            }
          : EMPTY_VALUES,
      );
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialCategory]);

  const onFormSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      setServerError(error.message ?? 'No se pudo guardar la categoría.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar categoría' : 'Agregar categoría'} size="md">
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        {serverError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Input label="Nombre" {...getFieldProps('name')} />
        <Select label="Tipo" options={TYPE_OPTIONS} value={values.type} onChange={handleChange} name="type" />
        <Input label="Imagen (URL)" type="url" {...getFieldProps('imageUrl')} />
        <Input label="Descripción" {...getFieldProps('description')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
