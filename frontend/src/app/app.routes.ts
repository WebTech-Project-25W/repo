import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';
import { OwnerDashboardComponent } from './restaurantOwner/dashboard/dashboard.component';
import { CustomerDashboardComponent } from './customer/dashboard/dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { OwnerGuard } from './guards/owner.guard';
import { CustomerGuard } from './guards/customer.guard';
import { RegistrationComponent } from './registration/registration.component';

export const routes: Routes = [
  // Authentification / Registration routes
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/registration', component: RegistrationComponent },
  
  // Site Manager Routes
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  
  // Owner Routes
  { path: 'owner/dashboard', component: OwnerDashboardComponent, canActivate: [OwnerGuard] },
  
  // Customer Routes
  { path: 'customer/dashboard', component: CustomerDashboardComponent, canActivate: [CustomerGuard] },
];