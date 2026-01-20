import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ProfileComponent {
  profile: any = {
  firstname: '',
  lastname: '',
  address: '',
  phonenumber: ''
};
  loading = true;
  success = '';
  error = '';

  constructor(
  private http: HttpClient,
  private router: Router
) {}


  ngOnInit() {
    this.http
      .get('http://localhost:3000/customer/profile')
      .subscribe(data => {
        this.profile = data;
        this.loading = false;
      });
  }

  save() {
  this.success = '';
  this.error = '';

  this.http
    .put('http://localhost:3000/customer/profile', this.profile)
    .subscribe({
      next: () => {
        this.success = 'Profile updated successfully!';
      },
      error: () => {
        this.error = 'Failed to update profile. Please try again.';
      }
    });
}


  goBack() {
  this.router.navigate(['/customer/dashboard']);
}

}

