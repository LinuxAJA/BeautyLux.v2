import { useId } from 'react';
import { NavLink } from 'react-router';

import { cn } from '../../utils/cn';

/**
 * Enlaces del panel agrupados por sección (`data/panelNav.js`). Lo comparten
 * la barra lateral de escritorio y el menú móvil de `DashboardLayout`.
 */
function PanelNav({ sections, className }) {
  const idPrefix = useId();

  return (
    <nav className={cn('space-y-3', className)} aria-label="Navegación del panel">
      {sections.map((section, index) => {
        const headingId = `${idPrefix}-section-${index}`;
        return (
          <div key={section.label}>
            <p id={headingId} className="label-caps mb-1 px-3 text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5" aria-labelledby={headingId}>
              {section.links.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
        );
      })}
    </nav>
  );
}

export default PanelNav;
