import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from "../../../shared/pagination/pagination.component";
import { BasePaginatedTable } from '../../../shared/pagination/base-paginated-table';

@Component({
  selector: 'app-order-log', // Updated selector
  standalone: true,
  imports: [DatePipe, FormsModule, PaginationComponent],
  templateUrl: './order-log.component.html',
  styleUrl: './order-log.component.css'
})
export class OrderLogComponent extends BasePaginatedTable<any> implements OnInit {
  // Search filters
  searchOrderId?: number = undefined;
  searchEmail: string = '';
  searchStatus: string = '';
  searchRestaurant: string = ''; // Added restaurant search

  constructor(private adminService: AdminService) { 
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getOrderLogs(
      this.searchOrderId,
      this.searchEmail, 
      this.searchStatus, 
      this.searchRestaurant, 
      this.limit, 
      offset
    ).subscribe({
      next: (resp: any) => {
        this.data = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
        console.log('Order logs loaded:', resp);
      },
      error: (err) => {
        console.error('Error fetching order-logs:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadData();
  }

  clearFilters(): void {
    this.searchOrderId = undefined;
    this.searchEmail = '';
    this.searchStatus = '';
    this.searchRestaurant = ''; // Reset restaurant search
    this.applyFilters();
  }
}