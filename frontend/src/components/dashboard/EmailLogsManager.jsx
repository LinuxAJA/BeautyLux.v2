import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DataTable from './DataTable';
import PageHeader from './PageHeader';
import TestEmailModal from './TestEmailModal';
import { useApi } from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import * as emailsService from '../../services/emails.service';
import { emailKindLabels, emailKindOptions, emailStatusBadges, emailStatusFilters } from '../../data/emailKinds';

// El placeholder de <Select> está deshabilitado: "todos" necesita su propia opción.
const KIND_FILTER_OPTIONS = [{ value: 'all', label: 'Todos los tipos' }, ...emailKindOptions];

/** "2026-09-28T14:05:31" → "28/9/2026, 2:05 p. m." */
function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Registro de correos del panel del admin (`/panel/admin/correos`): cada
 * correo que la API intentó enviar por Brevo, con su resultado. Es la
 * evidencia visible del envío y el lugar para diagnosticar un fallo sin
 * entrar a los logs de Render. Incluye el correo de prueba.
 */
function EmailLogsManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [isTestOpen, setIsTestOpen] = useState(false);

  const { page, setPage, withReset } = usePagination();

  const { data, meta, isLoading, error, refetch } = useApi(
    () =>
      emailsService.listEmailLogs({
        search,
        status,
        kind,
        page,
        perPage: 10,
        orderBy: 'createdAt',
        orderDir: 'desc',
      }),
    [search, status, kind, page],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const handleSendTest = async (to) => {
    const response = await emailsService.sendTestEmail(to);
    await refetch();
    return response.data;
  };

  const columns = [
    { key: 'createdAt', header: 'Fecha', render: (row) => formatDateTime(row.createdAt) },
    { key: 'kind', header: 'Tipo', render: (row) => emailKindLabels[row.kind] ?? row.kind },
    { key: 'recipient', header: 'Destinatario' },
    {
      key: 'subject',
      header: 'Asunto',
      render: (row) => (
        <span className="block max-w-52 truncate" title={row.subject}>
          {row.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => {
        const badge = emailStatusBadges[row.status] ?? { label: row.status, variant: 'muted' };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    { key: 'attempts', header: 'Intentos' },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) =>
        row.errorMessage ? (
          <span className="block max-w-48 truncate text-destructive" title={row.errorMessage}>
            {row.errorMessage}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Correos"
        description="Cada correo que la plataforma intentó enviar por Brevo y su resultado."
        actions={
          <Button variant="gradient" onClick={() => setIsTestOpen(true)}>
            <Send />
            Enviar correo de prueba
          </Button>
        }
      />

      <DataTable
        meta={meta}
        onPageChange={setPage}
        itemLabel="correos"
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={withReset(setSearch)}
        searchPlaceholder="Buscar por destinatario o asunto..."
        emptyMessage="No hay correos con estos filtros."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
              {emailStatusFilters.map((filter) => (
                <Button
                  key={filter.value || 'todos'}
                  variant={status === filter.value ? 'gradient' : 'outline'}
                  size="sm"
                  aria-pressed={status === filter.value}
                  onClick={() => withReset(setStatus)(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <Select
              aria-label="Filtrar por tipo de correo"
              options={KIND_FILTER_OPTIONS}
              value={kind || 'all'}
              onChange={(event) => withReset(setKind)(event.target.value === 'all' ? '' : event.target.value)}
              containerClassName="sm:w-56"
            />
          </div>
        }
      />

      <TestEmailModal isOpen={isTestOpen} onClose={() => setIsTestOpen(false)} onSend={handleSendTest} />
    </div>
  );
}

export default EmailLogsManager;
