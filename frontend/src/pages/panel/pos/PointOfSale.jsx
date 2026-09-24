import { CartProvider } from '../../../context/CartProvider';
import PosItemPicker from '../../../components/pos/PosItemPicker';
import PosTicket from '../../../components/pos/PosTicket';

/** Carrito aparte del de la tienda pública: una venta de mostrador no debe
 * mezclarse con lo que un cliente dejó guardado en su navegador. */
const POS_STORAGE_KEY = 'beautylux.pos-cart.v1';

/**
 * Punto de venta presencial, `/panel/admin/pos` y `/panel/empleado/pos`.
 *
 * Layout a dos columnas: buscador y grilla táctil del catálogo a la
 * izquierda, tique en vivo a la derecha. `canRegisterClient` decide si esta
 * sesión puede dar de alta clientes nuevos desde el mostrador — hoy solo el
 * administrador puede crear cuentas (`POST /api/users` es exclusivo de
 * admin), así que un empleado solo busca clientes ya existentes o vende a
 * consumidor final.
 */
function PointOfSale({ canRegisterClient = false }) {
  return (
    <CartProvider storageKey={POS_STORAGE_KEY}>
      {/* El diseño de dos columnas con altura fija es para pantallas de
          mostrador (tablet/escritorio); en un teléfono simplemente se
          apilan y la página completa hace scroll. */}
      <div className="grid grid-cols-1 gap-6 lg:h-[calc(100vh-7.5rem)] lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card lg:min-h-0 lg:overflow-hidden">
          <PosItemPicker />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card lg:min-h-0 lg:overflow-hidden">
          <PosTicket canRegisterClient={canRegisterClient} />
        </div>
      </div>
    </CartProvider>
  );
}

export default PointOfSale;
