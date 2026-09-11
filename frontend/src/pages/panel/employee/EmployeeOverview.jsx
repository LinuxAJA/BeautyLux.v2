import { Link } from 'react-router';
import { ArrowRight, Package, Users, Wrench } from 'lucide-react';

import StatCard from '../../../components/dashboard/StatCard';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import * as usersService from '../../../services/users.service';
import * as productsService from '../../../services/products.service';
import * as servicesService from '../../../services/services.service';

const QUICK_LINKS = [
  { to: '/panel/empleado/clientes', label: 'Ver clientes', icon: Users },
  { to: '/panel/empleado/productos', label: 'Gestionar productos', icon: Package },
  { to: '/panel/empleado/servicios', label: 'Gestionar servicios', icon: Wrench },
];

function EmployeeOverview() {
  const { user } = useAuth();
  const { meta: clientsMeta } = useApi(() => usersService.listUsers({ role: 'client', perPage: 1 }), []);
  const { meta: productsMeta } = useApi(() => productsService.listProducts({ perPage: 1 }), []);
  const { meta: servicesMeta } = useApi(() => servicesService.listServices({ perPage: 1 }), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Hola, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground">
          Desde aquí puedes consultar y editar clientes, y gestionar el catálogo de productos y servicios.
          Los cambios de estado, la eliminación de cuentas y la bitácora son exclusivos del administrador.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Clientes registrados" value={clientsMeta?.total} />
        <StatCard icon={Package} label="Productos en catálogo" value={productsMeta?.total} />
        <StatCard icon={Wrench} label="Servicios activos" value={servicesMeta?.total} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground/80 shadow-card smooth-transition hover:border-primary/40 hover:text-primary"
          >
            <span className="flex items-center gap-2.5">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EmployeeOverview;
