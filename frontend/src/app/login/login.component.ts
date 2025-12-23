  import { Component } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { AuthService } from './service';
  import { Router } from '@angular/router';

  @Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
  })
  export class LoginComponent {
    username = '';
    password = '';

    constructor(
      private authService: AuthService,
      private router: Router
    ) {}
  
    onLogin() {
      this.authService.login(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Login successful!', response);
          localStorage.setItem('token', response.token); // Store the JWT

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
          alert('Login failed: ' + err.error.message);
        }
      });
    }
  } 
