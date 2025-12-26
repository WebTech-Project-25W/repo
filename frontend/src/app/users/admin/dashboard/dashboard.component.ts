import { Component } from '@angular/core';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PasswordResetComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent {

}
