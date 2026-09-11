import { ListTree, Package, Users, Wrench } from 'lucide-react';

import StatCard from '../../../components/dashboard/StatCard';
import { useApi } from '../../../hooks/useApi';
import * as usersService from '../../../services/users.service';
import * as productsService from '../../../services/products.service';
import * as servicesService from '../../../services/services.service';
import * as categoriesService from '../../../services/categories.service';
import { useAuth } from '../../../hooks/useAuth';

function AdminOverview() {
  const { user } = useAuth();
  const { meta: usersMeta } = useApi(() => usersService.listUsers({ perPage: 1 }), []);
  const { meta: productsMeta } = useApi(() => productsService.listProducts({ perPage: 1 }), []);
  const { meta: servicesMeta } = useApi(() => servicesService.listServices({ perPage: 1 }), []);
  // La API de categorías no pagina: cuenta el arreglo completo que devuelve.
  const { data: categories } = useApi(() => categoriesService.listCategories(), []);

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
        <StatCard icon={ListTree} label="Categorías" value={categories?.length} />
      </div>
    </div>
  );
}

export default AdminOverview;
