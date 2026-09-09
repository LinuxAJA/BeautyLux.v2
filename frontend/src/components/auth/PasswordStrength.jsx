import { getPasswordStrength } from '../../utils/validators';
import { cn } from '../../utils/cn';

const BAR_COLORS = [
  'bg-border',
  'bg-destructive',
  'bg-accent',
  'bg-rose-gold',
  'bg-success',
];

/** Barra visual de fortaleza de la contraseña (0 a 4). */
function PasswordStrength({ password }) {
  if (!password) return null;

  const { score, label } = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full smooth-transition',
              level <= score ? BAR_COLORS[score] : 'bg-border',
            )}
          />
        ))}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Seguridad de la contraseña: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}

export default PasswordStrength;
