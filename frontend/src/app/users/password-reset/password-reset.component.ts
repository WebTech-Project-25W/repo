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
    this.authService.resetPassword(this.newPassword).subscribe({
      next: (response) => {
        console.log('Password reset successful!', response);
        alert(`Password reset successful for user ${response.message}`);
      },
      error: (err) => {
        alert('Password reset failed: ' + err.error.message);
      }
    })
  }

}
