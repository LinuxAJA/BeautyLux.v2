import { Package, ScrollText, Users, Wrench } from 'lucide-react';

import { useApi } from '../../../hooks/useApi';
import * as usersService from '../../../services/users.service';
import * as productsService from '../../../services/products.service';
import * as servicesService from '../../../services/services.service';
import { useAuth } from '../../../hooks/useAuth';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className="flex size-11 items-center justify-center rounded-full bg-blush/50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-semibold">{value ?? '—'}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AdminOverview() {
  const { user } = useAuth();
  const { meta: usersMeta } = useApi(() => usersService.listUsers({ perPage: 1 }), []);
  const { meta: productsMeta } = useApi(() => productsService.listProducts({ perPage: 1 }), []);
  const { meta: servicesMeta } = useApi(() => servicesService.listServices({ perPage: 1 }), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Hola, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground">Resumen general de BeautyLux.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Usuarios registrados" value={usersMeta?.total} />
        <StatCard icon={Package} label="Productos en catálogo" value={productsMeta?.total} />
        <StatCard icon={Wrench} label="Servicios activos" value={servicesMeta?.total} />
        <StatCard icon={ScrollText} label="Rol actual" value={user.role.label} />
      </div>
    </div>
  );
}

export default AdminOverview;
