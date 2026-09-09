/**
 * Une clases CSS condicionales en una sola cadena.
 * Ignora valores falsy (false, null, undefined, "") para poder escribir
 * `cn("btn", isActive && "btn-active", error && "border-destructive")`.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default cn;
