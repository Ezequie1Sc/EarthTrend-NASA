import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'EarthTrend NASA | Climate Dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard')
        .then((module) => module.Dashboard),
  },
  {
    path: 'explorer',
    title: 'EarthTrend NASA | Earth Explorer',
    loadComponent: () =>
      import('./features/earth-explorer/pages/earth-explorer/earth-explorer')
        .then((module) => module.EarthExplorer),
  },
  {
    path: '**',
    redirectTo: '',
  },
];