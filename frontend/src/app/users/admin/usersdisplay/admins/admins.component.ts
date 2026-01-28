import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { User } from '../../../../model/user';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admins.component.html',
  styleUrl: './admins.component.css'
})
export class AdminsComponent implements OnInit {
  admins: User[] = [];

  // Pagination config
  limit: number = 5;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchEmail: string = '';
  searchFirstName: string = '';
  searchLastName: string = '';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadAdmins();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.admins.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadAdmins(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getUsers(
      'sitemanager',
      {
        email: this.searchEmail,
        firstName: this.searchFirstName,
        lastName: this.searchLastName,
      },
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.admins = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching customers:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAdmins();
  }

  clearFilters(): void {
    this.searchEmail = '';
    this.searchFirstName = '';
    this.searchLastName = '';
    this.applyFilters();
  }

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadAdmins();
  }

  nextPage(): void {
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadAdmins();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAdmins();
    }
  }
}