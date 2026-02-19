import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule, PasswordResetComponent]
})
export class ProfileComponent implements OnInit {

  profile = {
    firstname: '',
    lastname: '',
  };

  savedProfile = {
    firstname: '',
    lastname: '',
  };

  loading = true;
  error = '';
  success = '';

  constructor(
    private http: HttpClient,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;

    this.adminService.getProfile()
      .subscribe({
        next: data => {
          this.popuplatePofile(data);

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

    console.log(this.profile.firstname);
    this.adminService.updateProfile(this.profile.firstname, this.profile.lastname)
      .subscribe({
        next: (data: any) => {
          alert('Profile updated successfully!');
          this.popuplatePofile(data);

        },
        error: () => {
          alert('Failed to update profile. Please try again.');
        }
      });
  }

  popuplatePofile(data: any) {
    this.profile = {
      firstname: data.profile.firstName,
      lastname: data.profile.lastName,
    };

    this.savedProfile = { ...this.profile };
  }

}
