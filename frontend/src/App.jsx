import { Routes, Route } from 'react-router';

import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

import PanelRedirect from './pages/panel/PanelRedirect';
import Forbidden from './pages/panel/Forbidden';
import AdminOverview from './pages/panel/admin/AdminOverview';
import AdminUsers from './pages/panel/admin/AdminUsers';
import AdminProducts from './pages/panel/admin/AdminProducts';
import AdminServices from './pages/panel/admin/AdminServices';
import AdminCategories from './pages/panel/admin/AdminCategories';
import AdminAuditLog from './pages/panel/admin/AdminAuditLog';
import EmployeeOverview from './pages/panel/employee/EmployeeOverview';
import EmployeeClients from './pages/panel/employee/EmployeeClients';
import EmployeeProducts from './pages/panel/employee/EmployeeProducts';
import EmployeeServices from './pages/panel/employee/EmployeeServices';
import ClientDashboard from './pages/panel/client/ClientDashboard';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<Products />} />
        <Route path="servicios" element={<Services />} />
        <Route path="nosotros" element={<About />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<Auth />} />
      <Route path="/restablecer-contrasena" element={<Auth initialView="reset" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="panel" element={<PanelRedirect />} />
          <Route path="403" element={<Forbidden />} />

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="panel/admin" element={<AdminOverview />} />
            <Route path="panel/admin/usuarios" element={<AdminUsers />} />
            <Route path="panel/admin/productos" element={<AdminProducts />} />
            <Route path="panel/admin/servicios" element={<AdminServices />} />
            <Route path="panel/admin/categorias" element={<AdminCategories />} />
            <Route path="panel/admin/bitacora" element={<AdminAuditLog />} />
          </Route>

          <Route element={<RoleRoute allow={['employee']} />}>
            <Route path="panel/empleado" element={<EmployeeOverview />} />
            <Route path="panel/empleado/clientes" element={<EmployeeClients />} />
            <Route path="panel/empleado/productos" element={<EmployeeProducts />} />
            <Route path="panel/empleado/servicios" element={<EmployeeServices />} />
          </Route>

          <Route element={<RoleRoute allow={['client']} />}>
            <Route path="panel/cliente" element={<ClientDashboard />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
