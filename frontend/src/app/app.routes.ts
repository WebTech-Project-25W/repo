import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';

import { AdminDashboardComponent } from './users/admin/dashboard/dashboard.component';
import { OwnerDashboardComponent } from './users/restaurantOwner/dashboard/dashboard.component';
import { CustomerDashboardComponent } from './users/customer/dashboard/dashboard.component';

import { RestaurantsComponent } from './public/restaurants/restaurants.component';
import { RestaurantDetailComponent } from './public/restaurant-detail/restaurant-detail.component';

import { AdminGuard } from './guards/admin.guard';
import { OwnerGuard } from './guards/owner.guard';
import { CustomerGuard } from './guards/customer.guard';
import { HomeComponent } from './public/home/home.component';

import { MenuComponent } from './users/customer/menu/menu.component';
import { OrdersComponent } from './users/customer/orders/orders.component';
import { OrderDetailsComponent } from './users/customer/orders/order-details/order-details.component';
import { ProfileComponent } from './users/customer/profile/profile.component';

export const routes: Routes = [
  // 🌍 PUBLIC ROUTES (NO AUTH REQUIRED)
  { path: 'home', component: HomeComponent },

  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'restaurants', component: RestaurantsComponent },

  { path: 'restaurants/:id', component: RestaurantDetailComponent },

  // 🔐 AUTHENTICATION / REGISTRATION
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/registration', component: RegistrationComponent },

  // 👨‍💼 SITE MANAGER (ADMIN)
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
  },

  // 🧑‍🍳 RESTAURANT OWNER
  {
    path: 'owner/dashboard',
    component: OwnerDashboardComponent,
    canActivate: [OwnerGuard],
  },

  // 👤 CUSTOMER (OTHER TEAMMATE / OPTIONAL)
  { path: 'customer/dashboard',component: CustomerDashboardComponent,canActivate: [CustomerGuard],},
  { path: 'customer/restaurants/:id', component: MenuComponent, canActivate: [CustomerGuard] },
  { path: 'customer/orders', component: OrdersComponent,canActivate: [CustomerGuard]},
  { path: 'customer/orders/:id', component: OrderDetailsComponent, canActivate: [CustomerGuard] },
  { path: 'customer/profile',component: ProfileComponent,canActivate: [CustomerGuard]},


  // 🚫 FALLBACK
  { path: '**', redirectTo: '' },
];
