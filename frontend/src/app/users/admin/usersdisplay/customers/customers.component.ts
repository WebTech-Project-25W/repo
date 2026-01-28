import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { customer } from '../../../../model/customer';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  customers: customer[] = [];

  // Pagination config
  limit: number = 10;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchEmail: string = '';
  searchFirstName: string = '';
  searchLastName: string = '';
  searchStatus: string = ''; // 'not-blocked' or 'blocked'
  searchPostcode: string = '';
  searchDeliveryZone: string = '';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.customers.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadCustomers(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getCustomers(
      this.searchEmail,
      this.searchFirstName,
      this.searchLastName,
      this.searchStatus,
      this.searchPostcode,
      this.searchDeliveryZone,
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.customers = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching customers:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  clearFilters(): void {
    this.searchEmail = '';
    this.searchFirstName = '';
    this.searchLastName = '';
    this.searchStatus = '';
    this.searchPostcode = '';
    this.searchDeliveryZone = '';
    this.applyFilters();
  }

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  // Logic to block/unblock a customer
  onStatusChange(event: any, customer: any) {
    const oldValue = customer.status;
    const newValue = event.target.value;
    customer.isUpdating = true;

    this.adminService.updateBlockedStatus(customer.email, newValue) 
      .subscribe({
        next: (response: any) => {
          customer.status = response.status;
          customer.isUpdating = false;
        },
        error: () => {
          event.target.value = oldValue;
          customer.isUpdating = false;
          alert('Failed to update status of customer: ' + customer.email);
        }
      });
  }

  nextPage(): void {
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadCustomers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadCustomers();
    }
  }
}