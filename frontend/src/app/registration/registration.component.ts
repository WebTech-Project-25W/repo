import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  address = '';
  postcode = '';
  phoneNumber = '';
  deliveryZone = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onRegistration() {
    this.authService.register(
      this.email,
      this.password,
      this.firstName,
      this.lastName,
      this.address,
      this.postcode,
      this.phoneNumber,
      this.deliveryZone
    ).subscribe({
      next: (response) => {
        console.log('Registration successfull.', response);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        alert('Registration failed: ' + err.error.message);
      }
    })
  }
}