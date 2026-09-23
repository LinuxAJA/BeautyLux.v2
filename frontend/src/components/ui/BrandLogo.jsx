import { useId } from 'react';

import { cn } from '../../utils/cn';

/**
 * El isotipo se dibuja como SVG inline en vez de importar un archivo para que
 * herede el tamaño del contenedor, se pueda colorear con los tokens y no cueste
 * una petición extra. El logotipo y el claim son texto real (no <text> de SVG)
 * para que usen las fuentes del sistema de diseño y los lea un lector de pantalla.
 */
const CLAIM_BASE = 'font-semibold uppercase tracking-[0.12em] text-brand-gold';

const SIZES = {
  sm: { mark: 'size-8', word: 'text-xl', claim: 'text-[0.5rem]' },
  md: { mark: 'size-10', word: 'text-2xl', claim: 'text-[0.5625rem]' },
  lg: { mark: 'size-14', word: 'text-4xl', claim: 'text-[0.6875rem]' },
};

function BrandMark({ className }) {
  // useId evita que el degradado colisione cuando el logo se pinta varias veces.
  const gradientId = `beautylux-mark-${useId()}`;

  return (
    <svg
      viewBox="2 4 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 rounded-full shadow-glow', className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="44" height="44" rx="22" fill={`url(#${gradientId})`} />
      <path
        d="M24 13L26.5 21.5L35 24L26.5 26.5L24 35L21.5 26.5L13 24L21.5 21.5L24 13Z"
        fill="#FFFFFF"
      />
      <circle cx="31" cy="16" r="2" fill="#FFE082" />
      <circle cx="17" cy="31" r="1.5" fill="#FFE082" />
      <defs>
        <linearGradient
          id={gradientId}
          x1="2"
          y1="4"
          x2="46"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF758C" />
          <stop offset="100%" stopColor="#E85D88" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BrandLogo({ variant = 'full', size = 'md', withClaim = true, className }) {
  const scale = SIZES[size] ?? SIZES.md;

  if (variant === 'mark') {
    return <BrandMark className={cn(scale.mark, className)} />;
  }

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className={scale.mark} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-serif font-semibold tracking-tight', scale.word)}>
          Beauty<span className="text-gradient">Lux</span>
        </span>
        {withClaim && (
          <span className={cn('mt-1', CLAIM_BASE, scale.claim)}>Services &amp; Beauty</span>
        )}
      </span>
    </span>
  );
}

export { BrandLogo, BrandMark };
export default BrandLogo;
