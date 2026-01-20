import { Component } from '@angular/core';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";
import { UserListComponent } from '../user-list/user-list.component';
import { RestaurantListComponent } from '../restaurant-list/restaurant-list.component';
import { LoginLogListComponent } from "../login-log-list/login-log-list.component";
import { OrderLogComponent } from "../order-log/order-log.component";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PasswordResetComponent, UserListComponent, RestaurantListComponent, LoginLogListComponent, OrderLogComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent {

}
