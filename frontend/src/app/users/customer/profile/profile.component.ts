import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ProfileComponent implements OnInit {

  profile = {
    firstname: '',
    lastname: '',
    phonenumber: '',
    address: ''
  };

  savedProfile = {
    firstname: '',
    lastname: '',
    phonenumber: '',
    address: ''
  };

  loading = false;
  error = '';
  success = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

loadProfile() {
  this.loading = true;

  this.http.get<any>('http://localhost:3000/customer/profile', {
    withCredentials: true
  }).subscribe({
    next: data => {

      this.profile = {
        firstname: data.profile.firstName,
        lastname: data.profile.lastName,
        phonenumber: data.profile.phone,
        address: data.profile.address
      };

      this.savedProfile = { ...this.profile };

      this.loading = false;
    },
    error: err => {
      console.error(err);
      this.loading = false;
    }
  });
}



  save() {
  this.success = '';
  this.error = '';

  this.http
    .put('http://localhost:3000/customer/profile', this.profile, {
      withCredentials: true
    })
    .subscribe({
      next: () => {
        alert('Profile updated successfully!');
        this.loadProfile();
      },
      error: () => {
        alert('Failed to update profile. Please try again.');
      }
    });
}


  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}
