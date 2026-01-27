import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-log', // Updated selector
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './order-log.component.html',
  styleUrl: './order-log.component.css'
})
export class OrderLogComponent implements OnInit {
  logs: any[] = []; // Changed to any[] to match OrderHistory schema

  // Pagination config
  limit: number = 10;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchOrderId?: number = undefined;
  searchEmail: string = '';
  searchStatus: string = '';
  searchRestaurant: string = ''; // Added restaurant search

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  // Getters for cleaner HTML template logic
  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.logs.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadLogs(): void {
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
        this.logs = resp.data;
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
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchOrderId = undefined;
    this.searchEmail = '';
    this.searchStatus = '';
    this.searchRestaurant = ''; // Reset restaurant search
    this.applyFilters();
  }
  
  onLimitChange(): void {
    this.currentPage = 0;
    this.loadLogs();
  }

  nextPage(): void {
    // Prevent navigating past the last page
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLogs();
    }
  }
}