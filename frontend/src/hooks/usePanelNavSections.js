import { useCallback, useEffect, useMemo, useState } from 'react';
import { matchPath, useLocation } from 'react-router';

function readStored(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(storageKey, labels) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(labels));
  } catch {
    // Modo privado o almacenamiento bloqueado: el menú sigue funcionando en memoria.
  }
}

function findActiveSection(sections, pathname) {
  return sections.find((section) =>
    section.links.some((link) => matchPath({ path: link.to, end: Boolean(link.end) }, pathname)),
  )?.label;
}

/**
 * Secciones abiertas de la navegación del panel. Vive en `DashboardLayout`
 * para que la barra lateral y el menú móvil compartan el mismo estado.
 *
 * - Sin nada guardado, solo arranca abierta la sección de la página actual.
 * - Lo que el usuario abre o cierra se recuerda por rol en `localStorage`.
 * - Al llegar a una página de una sección cerrada, esa sección se abre sola:
 *   el enlace activo siempre queda a la vista.
 */
function usePanelNavSections(sections, role) {
  const { pathname } = useLocation();
  const storageKey = `beautylux.panel-nav.${role}.v1`;
  const activeLabel = findActiveSection(sections, pathname);

  const [openLabels, setOpenLabels] = useState(() => {
    const stored = readStored(storageKey);
    if (stored) return stored;
    return activeLabel ? [activeLabel] : [];
  });

  useEffect(() => {
    if (!activeLabel) return;
    setOpenLabels((current) => (current.includes(activeLabel) ? current : [...current, activeLabel]));
  }, [activeLabel]);

  useEffect(() => {
    writeStored(storageKey, openLabels);
  }, [storageKey, openLabels]);

  const toggle = useCallback((label) => {
    setOpenLabels((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }, []);

  const openSet = useMemo(() => new Set(openLabels), [openLabels]);

  return { isOpen: (label) => openSet.has(label), toggle, activeLabel };
}

export default usePanelNavSections;
