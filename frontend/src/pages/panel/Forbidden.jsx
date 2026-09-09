import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';

import Button from '../../components/ui/Button';

function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="size-12 text-destructive" aria-hidden="true" />
      <h1 className="font-serif text-2xl font-semibold">No tienes acceso a esta sección</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Tu rol actual no cuenta con permisos para ver esta página. Si crees que es un error, contacta al administrador.
      </p>
      <Link to="/panel">
        <Button variant="gradient">Ir a mi panel</Button>
      </Link>
    </div>
  );
}

export default Forbidden;
