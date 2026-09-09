import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import Badge from '../ui/Badge';
import CategoryFormModal from './CategoryFormModal';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import { useApi } from '../../hooks/useApi';
import * as categoriesService from '../../services/categories.service';

function CategoriesManager() {
  const [modalCategory, setModalCategory] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(() => categoriesService.listCategories(), []);

  const handleCreateOrUpdate = async (formValues) => {
    if (modalCategory) {
      await categoriesService.updateCategory(modalCategory.id, formValues);
    } else {
      await categoriesService.createCategory(formValues);
    }
    await refetch();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsActing(true);
    try {
      await categoriesService.deleteCategory(pendingDelete.id);
      await refetch();
      setPendingDelete(null);
    } catch (error) {
      setPendingDelete({ ...pendingDelete, error: error.message });
    } finally {
      setIsActing(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'type', header: 'Tipo', render: (row) => <Badge variant="outline">{row.type === 'product' ? 'Producto' : 'Servicio'}</Badge> },
    { key: 'description', header: 'Descripción', render: (row) => row.description ?? '—' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setModalCategory(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setPendingDelete(row)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Categorías</h1>
        <Button variant="gradient" onClick={() => setModalCategory(null)}>
          <Plus />
          Agregar categoría
        </Button>
      </div>

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} error={error} emptyMessage="No hay categorías." />

      <CategoryFormModal
        isOpen={modalCategory !== undefined}
        onClose={() => setModalCategory(undefined)}
        onSubmit={handleCreateOrUpdate}
        initialCategory={modalCategory}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isActing}
        title="Eliminar categoría"
        confirmLabel="Eliminar"
        description={
          pendingDelete?.error
            ? pendingDelete.error
            : `¿Eliminar "${pendingDelete?.name}"? Solo es posible si no tiene productos o servicios asociados.`
        }
      />
    </div>
  );
}

export default CategoriesManager;
