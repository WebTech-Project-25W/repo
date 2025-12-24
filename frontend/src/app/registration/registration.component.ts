import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  username = '';
  password = '';
  address = '';
  postcode = '';
  phoneNumber = '';

  onRegistration() {
    console.log('registration');
  }
}
