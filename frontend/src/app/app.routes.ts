import { Routes } from '@angular/router';

import { HomePage } from './pages/home.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'AIRCONSOLUTION SERVICES SAC | Aire acondicionado, mantenimiento y electricidad en Lima' },
  {
    path: 'seguimiento',
    loadComponent: () => import('./pages/tracking.page').then((m) => m.TrackingPage),
    title: 'Seguir mi reserva | AIRCONSOLUTION SERVICES SAC',
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./pages/privacy.page').then((m) => m.PrivacyPage),
    title: 'Política de privacidad | AIRCONSOLUTION SERVICES SAC',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
    title: 'Panel | AIRCONSOLUTION SERVICES SAC',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage),
    title: 'Página no encontrada | AIRCONSOLUTION SERVICES SAC',
  },
];
