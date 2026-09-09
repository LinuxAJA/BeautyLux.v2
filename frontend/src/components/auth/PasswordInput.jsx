import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

import Input from '../ui/Input';

/** Campo de contraseña con botón para mostrar u ocultar el texto. */
function PasswordInput({ ...props }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      type={isVisible ? 'text' : 'password'}
      icon={Lock}
      autoComplete="off"
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground smooth-transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isVisible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      }
      {...props}
    />
  );
}

export default PasswordInput;
