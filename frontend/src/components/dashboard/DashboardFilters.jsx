import { useMemo } from 'react';
import { FilterX } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useApi } from '../../hooks/useApi';
import * as productsService from '../../services/products.service';
import * as servicesService from '../../services/services.service';
import * as usersService from '../../services/users.service';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'processing', label: 'En preparación' },
  { value: 'completed', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

/**
 * Barra de filtros del dashboard del administrador (requisito 13): fecha
 * inicial, fecha final, producto, servicio, estado y cliente. Los mismos
 * seis valores alimentan la gráfica de barras, la gráfica lineal y la tabla
 * de últimas ventas, para que las tres muestren siempre el mismo recorte.
 */
function DashboardFilters({ value, onChange, onClear }) {
  const { data: products } = useApi(() => productsService.listProducts({ perPage: 100 }), []);
  const { data: services } = useApi(() => servicesService.listServices({ perPage: 100 }), []);
  const { data: clients } = useApi(() => usersService.listUsers({ role: 'client', perPage: 100 }), []);

  const productOptions = useMemo(
    () => (products ?? []).map((product) => ({ value: String(product.id), label: product.name })),
    [products],
  );
  const serviceOptions = useMemo(
    () => (services ?? []).map((service) => ({ value: String(service.id), label: service.name })),
    [services],
  );
  const clientOptions = useMemo(
    () =>
      (clients ?? []).map((clientUser) => ({
        value: String(clientUser.id),
        label: `${clientUser.firstName} ${clientUser.lastName}`,
      })),
    [clients],
  );

  const setField = (field, fieldValue) => onChange({ ...value, [field]: fieldValue });
  const hasActiveFilters = Object.values(value).some(Boolean);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Input
          type="date"
          label="Desde"
          value={value.dateFrom}
          onChange={(event) => setField('dateFrom', event.target.value)}
        />
        <Input
          type="date"
          label="Hasta"
          value={value.dateTo}
          onChange={(event) => setField('dateTo', event.target.value)}
        />
        <Select
          label="Producto"
          placeholder="Todos"
          options={productOptions}
          value={value.productId}
          onChange={(event) => setField('productId', event.target.value)}
        />
        <Select
          label="Servicio"
          placeholder="Todos"
          options={serviceOptions}
          value={value.serviceId}
          onChange={(event) => setField('serviceId', event.target.value)}
        />
        <Select
          label="Estado"
          placeholder="Todos"
          options={STATUS_OPTIONS}
          value={value.status}
          onChange={(event) => setField('status', event.target.value)}
        />
        <Select
          label="Cliente"
          placeholder="Todos"
          options={clientOptions}
          value={value.clientId}
          onChange={(event) => setField('clientId', event.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <FilterX className="size-4" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}

export default DashboardFilters;
