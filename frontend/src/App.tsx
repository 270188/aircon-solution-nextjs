import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { Effects } from './layout/Effects';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { Preloader } from './layout/Preloader';
import { Toasts } from './layout/Toasts';
import { HomePage } from './pages/HomePage';
import { useGlobalEffects } from './shared/effects';

// Las páginas internas se cargan solo cuando se visitan.
const TrackingPage = lazy(() => import('./pages/TrackingPage').then((m) => ({ default: m.TrackingPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const TITLES: Record<string, string> = {
  '/': 'AIRCONSOLUTION SERVICES SAC | Aire acondicionado, mantenimiento y electricidad en Lima',
  '/seguimiento': 'Seguir mi reserva | AIRCONSOLUTION SERVICES SAC',
  '/privacidad': 'Política de privacidad | AIRCONSOLUTION SERVICES SAC',
  '/admin': 'Panel | AIRCONSOLUTION SERVICES SAC',
};

/** Título de la pestaña por página y vuelta arriba al cambiar de página. */
function useRouteChanges(): void {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Página no encontrada | AIRCONSOLUTION SERVICES SAC';
    if (!hash) scrollTo({ top: 0 });
  }, [pathname, hash]);
}

export function App() {
  useGlobalEffects();
  useRouteChanges();

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Preloader />
      <Header />
      <main id="contenido" tabIndex={-1}>
        <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/seguimiento" element={<TrackingPage />} />
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Effects />
      <Toasts />
    </>
  );
}
