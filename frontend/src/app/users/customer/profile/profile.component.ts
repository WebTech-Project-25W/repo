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
    address: '',
    points: 0
  };

  savedProfile = {
    firstname: '',
    lastname: '',
    phonenumber: '',
    address: '',
    points: 0
  };

  loading = false;
  error = '';
  success = '';

  redeemedVoucher = '';
  rewardHistory: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadRewardHistory();

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
        address: data.profile.address,
        points: data.profile.points
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

  const payload = {
    firstname: this.profile.firstname,
    lastname: this.profile.lastname,
    phonenumber: this.profile.phonenumber,
    address: this.profile.address
  };

  this.http.put(
    'http://localhost:3000/customer/profile',
    payload,
    { withCredentials: true }
  ).subscribe({
    next: () => {
      alert('Profile updated successfully!');
      this.loadProfile(); 
    },
    error: () => {
      alert('Failed to update profile. Please try again.');
    }
  });
}

redeem(code: string) {
  this.http.post<any>(
    'http://localhost:3000/customer/loyalty/redeem',
    { voucherCode: code },
    { withCredentials: true }
  ).subscribe({
    next: res => {
      this.redeemedVoucher = res.voucherCode;
      this.loadProfile();
      this.loadRewardHistory(); 
    },
    error: err => {
      alert(err.error?.error || 'Redeem failed');
    }
  });
}

loadRewardHistory() {
  this.http.get<any[]>(
    'http://localhost:3000/customer/loyalty/history',
    { withCredentials: true }
  ).subscribe({
    next: data => this.rewardHistory = data,
    error: err => console.error(err)
  });
}

}
