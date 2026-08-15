import { Routes } from '@angular/router';
import { APPLICANT_ROLES, ROLE_SAE } from './core/auth/auth.constants';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

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
        canActivate: [roleGuard(APPLICANT_ROLES)],
        loadComponent: () =>
          import('./features/parking-requests/pages/my-requests-page/my-requests-page').then(
            (m) => m.MyRequestsPage,
          ),
      },
      {
        path: 'vehiculos',
        canActivate: [roleGuard(APPLICANT_ROLES)],
        loadComponent: () =>
          import('./features/vehicles/pages/my-vehicles-page/my-vehicles-page').then(
            (m) => m.MyVehiclesPage,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'solicitudes/nueva',
        canActivate: [roleGuard(APPLICANT_ROLES)],
        loadComponent: () =>
          import('./features/parking-requests/pages/new-request-page/new-request-page').then(
            (m) => m.NewRequestPage,
          ),
      },
      {
        path: 'solicitudes/desasignacion/:unassignmentId',
        canActivate: [roleGuard(APPLICANT_ROLES)],
        data: { mode: 'mine' },
        loadComponent: () =>
          import(
            './features/vehicles/pages/unassignment-detail-page/unassignment-detail-page'
          ).then((m) => m.UnassignmentDetailPage),
      },
      {
        path: 'solicitudes/:requestId',
        canActivate: [roleGuard(APPLICANT_ROLES)],
        loadComponent: () =>
          import('./features/parking-requests/pages/request-detail-page/request-detail-page').then(
            (m) => m.RequestDetailPage,
          ),
      },
      {
        path: 'revisiones',
        canActivate: [roleGuard([ROLE_SAE])],
        loadComponent: () =>
          import('./features/parking-reviews/pages/pending-reviews-page/pending-reviews-page').then(
            (m) => m.PendingReviewsPage,
          ),
      },
      {
        path: 'revisiones-vehiculos',
        canActivate: [roleGuard([ROLE_SAE])],
        loadComponent: () =>
          import(
            './features/parking-reviews/pages/vehicle-unassignment-reviews-page/vehicle-unassignment-reviews-page'
          ).then((m) => m.VehicleUnassignmentReviewsPage),
      },
      {
        path: 'revisiones-vehiculos/:unassignmentId',
        canActivate: [roleGuard([ROLE_SAE])],
        data: { mode: 'review' },
        loadComponent: () =>
          import(
            './features/vehicles/pages/unassignment-detail-page/unassignment-detail-page'
          ).then((m) => m.UnassignmentDetailPage),
      },
      {
        path: 'revisiones/:requestId',
        canActivate: [roleGuard([ROLE_SAE])],
        loadComponent: () =>
          import('./features/parking-reviews/pages/review-detail-page/review-detail-page').then(
            (m) => m.ReviewDetailPage,
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
