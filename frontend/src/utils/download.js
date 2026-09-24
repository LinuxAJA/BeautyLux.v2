/**
 * Dispara la descarga de un blob en el navegador.
 *
 * `apiRequest`/`downloadRequest` (services/api.js) traen el archivo a memoria;
 * esto es el último paso, específico del DOM, que lo lleva al disco del
 * usuario con un enlace temporal.
 */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? 'archivo';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revocar de inmediato puede cortar la descarga en algunos navegadores;
  // se da un margen antes de liberar la URL del objeto.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default saveBlob;
