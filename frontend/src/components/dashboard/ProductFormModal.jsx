import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { useApi } from '../../hooks/useApi';
import useForm from '../../hooks/useForm';
import * as categoriesService from '../../services/categories.service';

const EMPTY_VALUES = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  price: '',
  oldPrice: '',
  stock: '',
  imageUrl: '',
  badge: '',
};

const schema = {
  sku: { label: 'SKU', required: true, minLength: 2, maxLength: 40, messages: { required: 'El SKU es obligatorio.' } },
  name: { label: 'Nombre', required: true, minLength: 2, maxLength: 120, messages: { required: 'El nombre es obligatorio.' } },
  price: {
    label: 'Precio',
    required: true,
    messages: { required: 'El precio es obligatorio.' },
    validate: (value) => (Number(value) < 0 ? 'El precio no puede ser negativo.' : null),
  },
};

function ProductFormModal({ isOpen, onClose, onSubmit, initialProduct }) {
  const isEdit = Boolean(initialProduct);
  const [serverError, setServerError] = useState(null);

  const { data: categories } = useApi(() => categoriesService.listCategories('product'), [isOpen]);

  const { values, isSubmitting, getFieldProps, handleChange, handleSubmit, reset } = useForm(
    EMPTY_VALUES,
    schema,
  );

  useEffect(() => {
    if (isOpen) {
      reset(
        initialProduct
          ? {
              sku: initialProduct.sku,
              name: initialProduct.name,
              description: initialProduct.description ?? '',
              categoryId: initialProduct.category?.id ?? '',
              price: String(initialProduct.price),
              oldPrice: initialProduct.oldPrice ? String(initialProduct.oldPrice) : '',
              stock: String(initialProduct.stock),
              imageUrl: initialProduct.imageUrl ?? '',
              badge: initialProduct.badge ?? '',
            }
          : EMPTY_VALUES,
      );
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialProduct]);

  const onFormSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await onSubmit({
        ...data,
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        price: Number(data.price),
        oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
        stock: data.stock ? Number(data.stock) : 0,
      });
      onClose();
    } catch (error) {
      setServerError(error.message ?? 'No se pudo guardar el producto.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar producto' : 'Agregar producto'} size="lg">
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        {serverError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SKU" {...getFieldProps('sku')} disabled={isEdit} />
          <Input label="Nombre" {...getFieldProps('name')} />

          <Select
            label="Categoría"
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            value={values.categoryId ? String(values.categoryId) : ''}
            onChange={handleChange}
            name="categoryId"
          />
          <Input label="Imagen (URL)" name="imageUrl" value={values.imageUrl} onChange={handleChange} />

          <Input label="Precio" type="number" min="0" {...getFieldProps('price')} />
          <Input label="Precio anterior" type="number" min="0" name="oldPrice" value={values.oldPrice} onChange={handleChange} />

          <Input label="Existencias" type="number" min="0" name="stock" value={values.stock} onChange={handleChange} />
          <Input label="Etiqueta" name="badge" value={values.badge} onChange={handleChange} placeholder="Nuevo, Oferta..." />

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
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
