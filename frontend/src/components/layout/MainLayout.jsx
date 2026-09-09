import { Outlet } from 'react-router';

import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from '../common/WhatsAppButton';
import useScrollTop from '../../hooks/useScrollTop';

/** Estructura común de las páginas públicas: Header + contenido + Footer. */
function MainLayout() {
  useScrollTop();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default MainLayout;
