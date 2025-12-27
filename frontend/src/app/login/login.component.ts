  import { Component } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { AuthService } from '../services/auth.service';
  import { Router } from '@angular/router';

  @Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
  })
  export class LoginComponent {
    email = '';
    password = '';

    constructor(
      private authService: AuthService,
      private router: Router
    ) {}
  
    onLogin() {
      this.authService.login(this.email, this.password).subscribe({
        next: (response) => {
          console.log('Login successful!', response);
          localStorage.setItem('token', response.token); // Store the response including role and token
          localStorage.setItem('role', response.role); // Store the response including role and token

          const role = response.role;
          
          if (role === "SiteManager") {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === "RestaurantOwner") {
            this.router.navigate(['/owner/dashboard']);
          } else if (role === "Customer") {
            this.router.navigate(['/customer/dashboard']);
          }

        },
       error: (err) => {
  console.error('Login error full object:', err);

  let message = 'Unable to login';

  if (err?.error?.message) {
    message = err.error.message;
  } else if (typeof err?.error === 'string') {
    message = err.error;
  } else if (err?.status === 0) {
    message = 'Cannot reach server (CORS or backend down)';
  }

  alert('Login failed: ' + message);
}


      });
    }

    toRegistration() {
      this.router.navigate(['/auth/registration']);
    }
  } 
