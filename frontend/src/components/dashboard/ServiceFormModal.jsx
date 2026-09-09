import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { useApi } from '../../hooks/useApi';
import useForm from '../../hooks/useForm';
import * as categoriesService from '../../services/categories.service';

const EMPTY_VALUES = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  durationMinutes: '',
  imageUrl: '',
};

const schema = {
  name: { label: 'Nombre', required: true, minLength: 2, maxLength: 120, messages: { required: 'El nombre es obligatorio.' } },
  price: {
    label: 'Precio',
    required: true,
    messages: { required: 'El precio es obligatorio.' },
    validate: (value) => (Number(value) < 0 ? 'El precio no puede ser negativo.' : null),
  },
  durationMinutes: {
    label: 'Duración',
    required: true,
    messages: { required: 'La duración es obligatoria.' },
    validate: (value) => (Number(value) <= 0 ? 'La duración debe ser mayor a 0 minutos.' : null),
  },
};

function ServiceFormModal({ isOpen, onClose, onSubmit, initialService }) {
  const isEdit = Boolean(initialService);
  const [serverError, setServerError] = useState(null);

  const { data: categories } = useApi(() => categoriesService.listCategories('service'), [isOpen]);

  const { values, isSubmitting, getFieldProps, handleChange, handleSubmit, reset } = useForm(
    EMPTY_VALUES,
    schema,
  );

  useEffect(() => {
    if (isOpen) {
      reset(
        initialService
          ? {
              name: initialService.name,
              description: initialService.description ?? '',
              categoryId: initialService.category?.id ?? '',
              price: String(initialService.price),
              durationMinutes: String(initialService.durationMinutes),
              imageUrl: initialService.imageUrl ?? '',
            }
          : EMPTY_VALUES,
      );
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialService]);

  const onFormSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await onSubmit({
        ...data,
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        price: Number(data.price),
        durationMinutes: Number(data.durationMinutes),
      });
      onClose();
    } catch (error) {
      setServerError(error.message ?? 'No se pudo guardar el servicio.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar servicio' : 'Agregar servicio'} size="lg">
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        {serverError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" {...getFieldProps('name')} />
          <Select
            label="Categoría"
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            value={values.categoryId ? String(values.categoryId) : ''}
            onChange={handleChange}
            name="categoryId"
          />

          <Input label="Precio" type="number" min="0" {...getFieldProps('price')} />
          <Input label="Duración (minutos)" type="number" min="1" {...getFieldProps('durationMinutes')} />

          <Input label="Imagen (URL)" name="imageUrl" value={values.imageUrl} onChange={handleChange} containerClassName="sm:col-span-2" />
          <Input
            label="Descripción"
            containerClassName="sm:col-span-2"
            name="description"
            value={values.description}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ServiceFormModal;
