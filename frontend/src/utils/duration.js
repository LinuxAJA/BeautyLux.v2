/**
 * Convierte 150 en "2 h 30 min", que se lee mejor que "150 min".
 *
 * Vivía dentro de `ServiceCard`, pero la bolsa muestra la misma duración en sus
 * filas, así que se comparte desde aquí.
 */
export function formatDuration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export default formatDuration;
