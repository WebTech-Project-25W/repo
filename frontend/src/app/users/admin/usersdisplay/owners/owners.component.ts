import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { User } from '../../../../model/user';

@Component({
  selector: 'app-owners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owners.component.html',
  styleUrl: './owners.component.css'
})
export class OwnersComponent implements OnInit{
  owners: User[] = [];

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
    this.loadOwners();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.owners.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadOwners(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getUsers(
      'restaurantowner',
      {
        email: this.searchEmail,
        firstName: this.searchFirstName,
        lastName: this.searchLastName,
      },
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.owners = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching customers:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadOwners();
  }

  clearFilters(): void {
    this.searchEmail = '';
    this.searchFirstName = '';
    this.searchLastName = '';
    this.applyFilters();
  }

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadOwners();
  }

  nextPage(): void {
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadOwners();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadOwners();
    }
  }
}