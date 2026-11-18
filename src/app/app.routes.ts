import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { authGuard } from './core/guards/auth-guard';
import { NO_INDEX } from './core/services/seo';

// Pagina's met NO_INDEX (achter login, tokenlinks, 404) krijgen robots=noindex via SeoService.
// Home blijft eager (landingspagina); de overige pagina's worden pas geladen bij navigatie.
export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.Login) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.Register) },
  {
    path: 'password-reset',
    loadComponent: () => import('./features/auth/password-reset/password-reset').then((m) => m.PasswordReset),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
    data: { [NO_INDEX]: true },
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./features/admin/user-management/user-management').then((m) => m.UserManagement),
    canActivate: [authGuard],
    data: { [NO_INDEX]: true },
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
    data: { [NO_INDEX]: true },
  },
  {
    path: 'vehicles',
    loadComponent: () => import('./features/vehicles/vehicle-list/vehicle-list').then((m) => m.VehicleList),
    canActivate: [authGuard],
    data: { [NO_INDEX]: true },
  },
  {
    path: 'vehicles/:id',
    loadComponent: () => import('./features/vehicles/vehicle-detail/vehicle-detail').then((m) => m.VehicleDetail),
    canActivate: [authGuard],
    data: { [NO_INDEX]: true },
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
    data: { [NO_INDEX]: true },
  },
];
