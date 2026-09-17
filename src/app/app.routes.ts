import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PasswordReset } from './features/auth/password-reset/password-reset';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { UserManagement } from './features/admin/user-management/user-management';
import { VehicleList } from './features/vehicles/vehicle-list/vehicle-list';
import { VehicleDetail } from './features/vehicles/vehicle-detail/vehicle-detail';
import { Profile } from './features/profile/profile';
import { NotFound } from './features/not-found/not-found';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'password-reset', component: PasswordReset },
  { path: 'reset-password', component: ResetPassword },
  { path: 'admin/users', component: UserManagement, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'vehicles', component: VehicleList, canActivate: [authGuard] },
  { path: 'vehicles/:id', component: VehicleDetail, canActivate: [authGuard] },
  { path: '**', component: NotFound },
];
