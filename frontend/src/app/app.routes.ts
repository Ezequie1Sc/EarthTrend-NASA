
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
    path: '**',
    redirectTo: '',
  },
];
