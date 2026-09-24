import { useState } from 'react';
import { Receipt, Trash2 } from 'lucide-react';

import Button from '../ui/Button';
import CartItemRow from '../cart/CartItemRow';
import PosCustomerPanel from './PosCustomerPanel';
import PosCheckoutModal from './PosCheckoutModal';
import QuickClientModal from './QuickClientModal';
import { useCart } from '../../hooks/useCart';
import { useDisclosure } from '../../hooks/useDisclosure';
import * as usersService from '../../services/users.service';
import { formatPrice } from '../../data/products';

const EMPTY_CUSTOMER = { client: null, guest: { firstName: '', lastName: '', phone: '', email: '' } };

/** El tique está listo para cobrar si hay un cliente elegido o los datos mínimos de un consumidor final. */
function hasValidCustomer(customer) {
  return Boolean(customer.client) || (customer.guest.firstName.trim() && customer.guest.lastName.trim());
}

/**
 * Ticket en vivo del punto de venta: cliente, líneas del pedido y el botón
 * de cobro. Vive dentro del `CartProvider` propio del POS, con su
 * `storageKey` aparte para no mezclarse con la bolsa pública.
 */
function PosTicket({ canRegisterClient }) {
  const cart = useCart();
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [registerError, setRegisterError] = useState(null);
  const checkoutModal = useDisclosure(false);
  const clientModal = useDisclosure(false);

  const handleClientCreated = async (formValues) => {
    setRegisterError(null);
    try {
      const response = await usersService.createUser(formValues);
      const client = response.data;
      setCustomer({ client, guest: EMPTY_CUSTOMER.guest });
      return client;
    } catch (error) {
      setRegisterError(error.message ?? 'No se pudo registrar el cliente.');
      throw error;
    }
  };

  const handleClearTicket = () => {
    cart.clear();
    setCustomer(EMPTY_CUSTOMER);
  };

  const handleCheckoutCompleted = () => {
    setCustomer(EMPTY_CUSTOMER);
  };

  const isEmpty = cart.items.length === 0;
  const canCheckout = !isEmpty && hasValidCustomer(customer);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Receipt className="size-5 text-primary" aria-hidden="true" />
          Tique
        </h2>

        {registerError && (
          <p role="alert" className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {registerError}
          </p>
        )}

        <div className="mt-2">
          <PosCustomerPanel
            value={customer}
            onChange={setCustomer}
            canRegisterClient={canRegisterClient}
            onRequestNewClient={clientModal.open}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
        {isEmpty ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Toca un producto o servicio para añadirlo al tique.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {cart.items.map((item) => (
              <CartItemRow key={item.key} item={item} />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-baseline justify-between" aria-live="polite">
          <span className="text-sm text-muted-foreground">Total ({cart.itemCount})</span>
          <span className="text-xl font-semibold text-primary">{formatPrice(cart.subtotal)}</span>
        </div>

        <Button variant="gradient" fullWidth disabled={!canCheckout} onClick={checkoutModal.open}>
          Cobrar
        </Button>

        {!isEmpty && (
          <Button variant="ghost" fullWidth onClick={handleClearTicket}>
            <Trash2 className="size-4" />
            Vaciar tique
          </Button>
        )}
      </div>

      <PosCheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={checkoutModal.close}
        customer={customer}
        onCompleted={handleCheckoutCompleted}
      />

      <QuickClientModal isOpen={clientModal.isOpen} onClose={clientModal.close} onCreated={handleClientCreated} />
    </div>
  );
}

export default PosTicket;
