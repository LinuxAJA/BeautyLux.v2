/**
 * Iconos de redes sociales como SVG inline.
 *
 * lucide-react v1 eliminó los iconos de marca (Instagram, Facebook, X,
 * YouTube), por eso se definen aquí en lugar de importarlos.
 */

const PATHS = {
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  twitter: (
    <path d="M18.9 2.5h3.4l-7.4 8.4L23.5 22h-6.8l-5.3-7-6.1 7H1.9l7.9-9-8-10.5h7l4.8 6.4zm-1.2 17.4h1.9L7.3 4.4H5.3z" />
  ),
  youtube: (
    <>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </>
  ),
};

/** Los iconos de marca sólidos se ven mejor rellenos que en trazo. */
const FILLED = new Set(['twitter', 'facebook']);

function SocialIcon({ name, className = 'size-4', ...props }) {
  const path = PATHS[name];
  if (!path) return null;

  const isFilled = FILLED.has(name);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );
}

export default SocialIcon;
