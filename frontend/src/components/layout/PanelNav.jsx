import { useId } from 'react';
import { NavLink } from 'react-router';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Enlaces del panel agrupados por sección (`data/panelNav.js`). Lo comparten
 * la barra lateral de escritorio y el menú móvil de `DashboardLayout`.
 *
 * Cada sección se pliega con su encabezado. Qué secciones están abiertas lo
 * decide `usePanelNavSections` (en el layout), para que ambas vistas estén
 * de acuerdo. Una sección cerrada queda `inert`: sus enlaces no reciben foco
 * con Tab mientras no se ven.
 */
function PanelNav({ sections, isOpen, onToggle, activeLabel, className }) {
  const idPrefix = useId();

  return (
    <nav className={cn('space-y-1', className)} aria-label="Navegación del panel">
      {sections.map((section, index) => {
        const listId = `${idPrefix}-section-${index}`;
        const open = isOpen(section.label);
        const holdsActivePage = section.label === activeLabel;

        return (
          <div key={section.label}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => onToggle(section.label)}
              className="label-caps flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-muted-foreground smooth-transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex-1 text-left">{section.label}</span>
              {!open && holdsActivePage && (
                <>
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="sr-only">(contiene la página actual)</span>
                </>
              )}
              <ChevronDown
                className={cn('size-3.5 smooth-transition motion-reduce:transition-none', open ? 'rotate-0' : '-rotate-90')}
                aria-hidden="true"
              />
            </button>

            <div
              className={cn(
                'grid smooth-transition motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <ul id={listId} className="min-h-0 space-y-0.5 overflow-hidden" inert={!open}>
                {section.links.map(({ to, label, icon: Icon, end }) => (
                  <li key={to} className="first:pt-0.5 last:pb-1">
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                          isActive ? 'bg-blush/40 text-primary' : 'text-foreground/70 hover:bg-muted',
                        )
                      }
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default PanelNav;
