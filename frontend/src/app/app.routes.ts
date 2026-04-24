import { Routes } from '@angular/router';
import { authGuard, redirectIfAuthedGuard, roleGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [redirectIfAuthedGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/shared/forbidden.component').then((m) => m.ForbiddenComponent)
  },
  {
    path: 'customer',
    canActivate: [authGuard, roleGuard('CUSTOMER')],
    loadComponent: () =>
      import('./features/shell/customer-shell.component').then((m) => m.CustomerShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'requests' },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/customer/my-requests.component').then((m) => m.MyRequestsComponent)
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/customer/new-request.component').then((m) => m.NewRequestComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'queue' },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/admin/admin-queue.component').then((m) => m.AdminQueueComponent)
      },
      {
        path: 'queue/:id',
        loadComponent: () =>
          import('./features/admin/request-detail.component').then((m) => m.RequestDetailComponent)
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/admin/audit-log.component').then((m) => m.AuditLogComponent)
      }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
