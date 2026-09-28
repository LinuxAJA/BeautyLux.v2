/**
 * Etiquetas del registro de correos (`kind` y `status` de `email_logs`).
 * Los `kind` son los que envía el backend (`backendFastAPI/README.md`,
 * sección "Correo").
 */
export const emailKindOptions = [
  { value: 'welcome', label: 'Bienvenida' },
  { value: 'password_reset_requested', label: 'Recuperación de contraseña' },
  { value: 'password_reset_completed', label: 'Contraseña actualizada' },
  { value: 'sale_created', label: 'Confirmación de compra' },
  { value: 'invoice_issued', label: 'Factura emitida' },
  { value: 'appointment_confirmed', label: 'Cita confirmada' },
  { value: 'appointment_rescheduled', label: 'Cita reprogramada' },
  { value: 'appointment_cancelled', label: 'Cita cancelada' },
  { value: 'pqr_received', label: 'PQR radicada' },
  { value: 'pqr_answered', label: 'PQR respondida' },
  { value: 'test', label: 'Correo de prueba' },
];

export const emailKindLabels = Object.fromEntries(emailKindOptions.map(({ value, label }) => [value, label]));

export const emailStatusFilters = [
  { value: '', label: 'Todos' },
  { value: 'sent', label: 'Enviados' },
  { value: 'failed', label: 'Fallidos' },
  { value: 'skipped', label: 'Solo log' },
];

/** `skipped` = MAIL_ENABLED=false: el correo se escribió en el log y no salió. */
export const emailStatusBadges = {
  sent: { label: 'Enviado', variant: 'soft' },
  failed: { label: 'Fallido', variant: 'default' },
  skipped: { label: 'Solo log', variant: 'muted' },
};
