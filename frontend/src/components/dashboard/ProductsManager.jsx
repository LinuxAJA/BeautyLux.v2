import { useMemo, useState } from 'react';
import { Pencil, Plus, PowerOff, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import ConfirmDialog from './ConfirmDialog';
import DataTable from './DataTable';
import ProductFormModal from './ProductFormModal';
import StatusBadge from './StatusBadge';
import { useApi } from '../../hooks/useApi';
import * as productsService from '../../services/products.service';
import { formatPrice } from '../../data/products';

function ProductsManager({ canDelete = true }) {
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState(undefined);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isActing, setIsActing] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () => productsService.listProducts({ search, perPage: 50 }),
    [search],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleCreateOrUpdate = async (formValues) => {
    if (modalProduct) {
      await productsService.updateProduct(modalProduct.id, formValues);
    } else {
      await productsService.createProduct(formValues);
    }
    await refetch();
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsActing(true);
    setActionError(null);
    try {
      if (pendingAction.type === 'delete') {
        await productsService.deleteProduct(pendingAction.product.id);
      } else {
        await productsService.updateProductStatus(pendingAction.product.id, pendingAction.nextStatus);
      }
      await refetch();
      setPendingAction(null);
    } catch (error) {
      setActionError(error.message ?? 'No se pudo completar la acción.');
    } finally {
      setIsActing(false);
    }
  };

  const closeActionDialog = () => {
    setPendingAction(null);
    setActionError(null);
  };

  const columns = [
    { key: 'name', header: 'Producto' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Categoría', render: (row) => row.category?.name ?? '—' },
    { key: 'price', header: 'Precio', render: (row) => formatPrice(row.price) },
    { key: 'stock', header: 'Stock' },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setModalProduct(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar estado"
            onClick={() =>
              setPendingAction({
                type: 'status',
                product: row,
                nextStatus: row.status === 'active' ? 'inactive' : 'active',
              })
            }
          >
            <PowerOff className="size-4" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => setPendingAction({ type: 'delete', product: row })}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Productos</h1>
        <Button variant="gradient" onClick={() => setModalProduct(null)}>
          <Plus />
          Agregar producto
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
        emptyMessage="No hay productos para mostrar."
      />

      <ProductFormModal
        isOpen={modalProduct !== undefined}
        onClose={() => setModalProduct(undefined)}
        onSubmit={handleCreateOrUpdate}
        initialProduct={modalProduct}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={closeActionDialog}
        onConfirm={confirmAction}
        isLoading={isActing}
        error={actionError}
        title={pendingAction?.type === 'delete' ? 'Eliminar producto' : 'Cambiar estado'}
        confirmLabel={pendingAction?.type === 'delete' ? 'Eliminar' : 'Confirmar'}
        description={
          pendingAction?.type === 'delete'
            ? `¿Eliminar "${pendingAction?.product.name}"? Se ocultará del catálogo.`
            : `¿Cambiar el estado de "${pendingAction?.product.name}" a "${pendingAction?.nextStatus === 'active' ? 'Activo' : 'Inactivo'}"?`
        }
      />
    </div>
  );
}

export default ProductsManager;
