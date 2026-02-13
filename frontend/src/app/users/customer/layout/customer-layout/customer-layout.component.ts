import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';


@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterModule,SidebarComponent], 
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.css']
})
export class CustomerLayoutComponent {
  customerMenu = [
  { label: 'Restaurants', route: '/customer/dashboard' },
  { label: 'My Orders', route: '/customer/orders' },
  { label: 'My Profile', route: '/customer/profile' }
];
}
