import { Component } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent {
  newPassword = '';

  constructor(
    private authService: AuthService
  ) {}

  onResetPassword() {
    console.log('resetpass');
  }

}
