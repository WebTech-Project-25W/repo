import { Component } from '@angular/core';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";
import { UserListComponent } from '../user-list/user-list.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PasswordResetComponent, UserListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent {

}
