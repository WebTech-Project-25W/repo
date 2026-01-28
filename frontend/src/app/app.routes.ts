import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';

import { AdminDashboardComponent } from './users/admin/dashboard/dashboard.component';
import { OwnerDashboardComponent } from './users/restaurantOwner/dashboard/dashboard.component';

import { RestaurantsComponent } from './public/restaurants/restaurants.component';
import { RestaurantDetailComponent } from './public/restaurant-detail/restaurant-detail.component';

import { AdminGuard } from './guards/admin.guard';
import { OwnerGuard } from './guards/owner.guard';
import { HomeComponent } from './public/home/home.component';

import { CustomerLayoutComponent } from './users/customer/layout/customer-layout/customer-layout.component';


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
    path: 'admin',
    component: AdminDashboardComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./users/admin/dashboard/dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'order-log',
        loadComponent: () =>
          import('./users/admin/order-log/order-log.component')
            .then(m => m.OrderLogComponent)
      },
      {
        path: 'login-log',
        loadComponent: () =>
          import('./users/admin/login-log/login-log.component')
            .then(m => m.LoginLogComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/admin/usersdisplay/customers/customers.component')
            .then(m => m.CustomersComponent)
      },    
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./users/admin/restaurants/restaurants.component')
            .then(m => m.RestaurantsComponent)
      },           

    ],
    canActivate: [AdminGuard],
  },

  // 🧑‍🍳 RESTAURANT OWNER
  {
    path: 'owner/dashboard',
    component: OwnerDashboardComponent,
    canActivate: [OwnerGuard],
  },

  // 👤 CUSTOMER (OTHER TEAMMATE / OPTIONAL)
  {
  path: 'customer',
  component: CustomerLayoutComponent,
  children: [
    {
      path: 'dashboard',
      loadComponent: () =>
        import('./users/customer/dashboard/dashboard.component')
          .then(m => m.CustomerDashboardComponent)
    },
    {
      path: 'orders',
      loadComponent: () =>
        import('./users/customer/orders/orders.component')
          .then(m => m.OrdersComponent)
    },
    {
      path: 'profile',
      loadComponent: () =>
        import('./users/customer/profile/profile.component')
          .then(m => m.ProfileComponent)
    },
    {
     path: 'restaurants/:id',
        loadComponent: () =>
        import('./public/restaurant-detail/restaurant-detail.component')
      .then(m => m.RestaurantDetailComponent)
    },
    {
     path: 'orders/:orderId',
        loadComponent: () =>
        import('./users/customer/orders/order-details/order-details.component')
      .then(m => m.OrderDetailsComponent)
    },

    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    }
  ]
},


  // 🚫 FALLBACK
  { path: '**', redirectTo: '' },
];
