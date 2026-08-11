import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page').then((m) => m.LoginPage),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/parking-requests/pages/my-requests-page/my-requests-page').then(
            (m) => m.MyRequestsPage,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'solicitudes/nueva',
        loadComponent: () =>
          import('./features/parking-requests/pages/new-request-page/new-request-page').then(
            (m) => m.NewRequestPage,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
