import { useState } from 'react';
import { Search, User, UserPlus, X } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApi } from '../../hooks/useApi';
import * as usersService from '../../services/users.service';

/**
 * Cliente de la venta: uno registrado (buscado por documento/nombre/correo)
 * o "consumidor final" sin cuenta. `onChange` recibe `{ client, guest }`, con
 * el que no aplica en cada caso puesto en `null`/vacío.
 */
function PosCustomerPanel({ value, onChange, canRegisterClient, onRequestNewClient }) {
  const [search, setSearch] = useState('');

  const { data: results, isLoading } = useApi(
    () => (search.trim() ? usersService.listUsers({ search, role: 'client', perPage: 6 }) : Promise.resolve({ data: [] })),
    [search],
  );

  const selectClient = (client) => {
    onChange({ client, guest: { firstName: '', lastName: '', phone: '', email: '' } });
    setSearch('');
  };

  const clearClient = () => onChange({ client: null, guest: value.guest });

  const setGuestField = (field, fieldValue) =>
    onChange({ client: null, guest: { ...value.guest, [field]: fieldValue } });

  if (value.client) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-blush/30 p-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="size-4 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {value.client.firstName} {value.client.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{value.client.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Quitar cliente seleccionado" onClick={clearClient}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente por documento, nombre o correo..."
          aria-label="Buscar cliente registrado"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {search.trim() && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
          {isLoading && <p className="p-2 text-xs text-muted-foreground">Buscando...</p>}
          {!isLoading && (results ?? []).length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">Sin coincidencias.</p>
          )}
          {(results ?? []).map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => selectClient(client)}
              className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">
                {client.firstName} {client.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {client.documentNumber} · {client.email}
              </span>
            </button>
          ))}
        </div>
      )}

      {canRegisterClient && (
        <Button variant="outline" size="sm" onClick={onRequestNewClient}>
          <UserPlus className="size-4" />
          Nuevo cliente
        </Button>
      )}

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <p className="label-caps text-muted-foreground">Consumidor final (sin cuenta)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Nombre"
            value={value.guest.firstName}
            onChange={(event) => setGuestField('firstName', event.target.value)}
          />
          <Input
            label="Apellido"
            value={value.guest.lastName}
            onChange={(event) => setGuestField('lastName', event.target.value)}
          />
          <Input
            label="Teléfono"
            value={value.guest.phone}
            onChange={(event) => setGuestField('phone', event.target.value)}
          />
          <Input
            label="Correo (opcional)"
            type="email"
            value={value.guest.email}
            onChange={(event) => setGuestField('email', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default PosCustomerPanel;
