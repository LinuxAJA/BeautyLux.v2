import { useCallback, useEffect, useMemo, useReducer } from 'react';

import { CartContext } from './CartContext';
import { useDisclosure } from '../hooks/useDisclosure';

/** Umbral de envío gratis, el mismo que anuncia la barra dorada del Header. */
const FREE_SHIPPING_THRESHOLD = 150000;

/** Clave por defecto en localStorage. La etapa del POS monta otro carrito con su propia clave. */
const DEFAULT_STORAGE_KEY = 'beautylux.cart.v1';

/** Identidad de un ítem dentro de la bolsa: un producto y un servicio pueden compartir id. */
function itemKey(itemType, itemId) {
  return `${itemType}:${itemId}`;
}

/**
 * Normaliza lo que envían las tarjetas a la forma que guarda la bolsa.
 * Devuelve `null` si falta el id real: sin él la venta de la etapa 6 no podría
 * escribir `sale_details`, así que es preferible no añadir el ítem.
 */
function normalizeItem(entry) {
  const itemType = entry?.itemType === 'service' ? 'service' : 'product';
  const itemId = Number(entry?.itemId);

  if (!Number.isInteger(itemId) || itemId <= 0) return null;
  if (typeof entry.name !== 'string' || !entry.name) return null;

  const price = Number(entry.price);
  if (!Number.isFinite(price)) return null;

  return {
    key: itemKey(itemType, itemId),
    itemType,
    itemId,
    slug: entry.slug ?? null,
    name: entry.name,
    price,
    image: entry.image ?? null,
    quantity: 1,
    // Solo productos: tope de existencias para no dejar pedir más de lo que hay.
    stock: itemType === 'product' && Number.isInteger(entry.stock) ? entry.stock : null,
    // Solo servicios: se muestra en la bolsa y la necesita la agenda de la etapa 5.
    durationMinutes: itemType === 'service' ? (entry.durationMinutes ?? null) : null,
  };
}

/** Limita la cantidad a [1, stock]; sin stock conocido solo exige el mínimo. */
function clampQuantity(item, quantity) {
  // Un servicio es una cita en cabina: no se acumula, siempre va de a uno.
  if (item.itemType === 'service') return 1;

  const value = Math.floor(Number(quantity));
  if (!Number.isFinite(value) || value < 1) return 1;
  if (item.stock !== null && value > item.stock) return Math.max(item.stock, 1);
  return value;
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.items;

    case 'add': {
      const incoming = action.item;
      const existing = state.find((item) => item.key === incoming.key);

      if (!existing) return [...state, incoming];

      // El servicio se queda en uno; el producto acumula sin pasarse del stock.
      return state.map((item) =>
        item.key === incoming.key
          ? { ...item, ...incoming, quantity: clampQuantity(item, item.quantity + 1) }
          : item,
      );
    }

    case 'update': {
      return state.map((item) =>
        item.key === action.key ? { ...item, quantity: clampQuantity(item, action.quantity) } : item,
      );
    }

    case 'remove':
      return state.filter((item) => item.key !== action.key);

    case 'clear':
      return [];

    default:
      return state;
  }
}

/**
 * Lee la bolsa guardada. Va envuelto en try/catch porque en ventana privada o
 * con el almacenamiento bloqueado `localStorage` lanza al leerlo, y la bolsa
 * tiene que seguir funcionando en memoria.
 */
function readStoredItems(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Lo guardado puede venir de una versión anterior del carrito: se revalida
    // ítem por ítem y se descarta lo que ya no encaje.
    return parsed
      .map((entry) => {
        const item = normalizeItem(entry);
        return item ? { ...item, quantity: clampQuantity(item, entry.quantity) } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Estado de la bolsa de compras: productos físicos y servicios de belleza.
 *
 * No habla con la API. Los totales que se muestran aquí son informativos: la
 * venta de la etapa 6 los recalcula en el servidor, que es quien manda.
 */
export function CartProvider({ children, storageKey = DEFAULT_STORAGE_KEY }) {
  const [items, dispatch] = useReducer(cartReducer, storageKey, readStoredItems);
  const { isOpen, open, close, toggle } = useDisclosure(false);

  // Persiste en cada cambio. Si el almacenamiento falla, la bolsa sigue viva en memoria.
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Sin persistencia, pero sin romper la navegación.
    }
  }, [items, storageKey]);

  const addItem = useCallback(
    (entry) => {
      const item = normalizeItem(entry);
      if (!item) return false;

      dispatch({ type: 'add', item });
      // Abrir el panel es la confirmación visual de que la acción surtió efecto.
      open();
      return true;
    },
    [open],
  );

  const updateQuantity = useCallback((key, quantity) => {
    if (Number(quantity) < 1) {
      dispatch({ type: 'remove', key });
      return;
    }
    dispatch({ type: 'update', key, quantity });
  }, []);

  const removeItem = useCallback((key) => dispatch({ type: 'remove', key }), []);

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const derived = useMemo(() => {
    const productItems = items.filter((item) => item.itemType === 'product');
    const serviceItems = items.filter((item) => item.itemType === 'service');
    const sum = (list) => list.reduce((total, item) => total + item.price * item.quantity, 0);
    const productsSubtotal = sum(productItems);

    return {
      productItems,
      serviceItems,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: productsSubtotal + sum(serviceItems),
      // El envío gratis se calcula solo sobre productos: una cita no se despacha.
      productsSubtotal,
      qualifiesForFreeShipping: productsSubtotal >= FREE_SHIPPING_THRESHOLD,
      missingForFreeShipping: Math.max(FREE_SHIPPING_THRESHOLD - productsSubtotal, 0),
    };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      ...derived,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      isOpen,
      open,
      close,
      toggle,
    }),
    [items, derived, addItem, updateQuantity, removeItem, clear, isOpen, open, close, toggle],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
