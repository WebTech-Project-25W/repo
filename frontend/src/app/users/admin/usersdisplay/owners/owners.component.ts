import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { User } from '../../../../model/user';
import { PaginationComponent } from "../../../../shared/pagination/pagination.component";
import { BasePaginatedTable } from '../../../../shared/pagination/base-paginated-table';

@Component({
  selector: 'app-owners',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './owners.component.html',
  styleUrl: './owners.component.css'
})
export class OwnersComponent extends BasePaginatedTable<User> implements OnInit{
  // Search filters
  searchEmail: string = '';
  searchFirstName: string = '';
  searchLastName: string = '';

  constructor(private adminService: AdminService) {
    super();
   }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData(): void {
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
        this.data = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching customers:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadData();
  }

  clearFilters(): void {
    this.searchEmail = '';
    this.searchFirstName = '';
    this.searchLastName = '';
    this.applyFilters();
  }
}