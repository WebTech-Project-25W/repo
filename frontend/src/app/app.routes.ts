import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';
import { OwnerDashboardComponent } from './restaurantOwner/dashboard/dashboard.component';
import { CustomerDashboardComponent } from './customer/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Site Manager Routes
  { path: 'admin/dashboard', component: AdminDashboardComponent }, //, canActivate: [AdminGuard] },
  
  // Owner Routes
  { path: 'owner/dashboard', component: OwnerDashboardComponent }, //, canActivate: [OwnerGuard] },
  
  // Customer Routes
  { path: 'customer/dashboard', component: CustomerDashboardComponent } //, canActivate: [UserGuard] },
];