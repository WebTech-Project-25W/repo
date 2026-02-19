import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  adminMenu = [
    { label: 'Overview', route: '/admin/overview' },
    { label: 'Order Log', route: '/admin/order-log' },
    { label: 'Login Log', route: '/admin/login-log' },
    { label: 'Users', route: '/admin/users' },
    { label: 'Restaurants', route: '/admin/restaurants' },
    { label: 'Global Settings', route: '/admin/global-settings' },
    { label: 'My Profile', route: '/admin/profile' }
  ]

}
