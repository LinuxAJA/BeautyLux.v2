import { LogOut } from 'lucide-react';

/** Pie de la navegación del panel: quién tiene la sesión y el cierre de sesión. */
function PanelAccount({ user, onLogout }) {
  return (
    <div className="border-t border-border p-3">
      <p className="truncate px-3 text-sm font-medium">
        {user.firstName} {user.lastName}
      </p>
      <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.role.label}</p>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive smooth-transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  );
}

export default PanelAccount;
