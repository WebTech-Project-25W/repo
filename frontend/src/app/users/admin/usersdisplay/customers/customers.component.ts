import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { Customer } from '../../../../model/customer';
import { SpinnerComponent } from "../../../../shared/spinner/spinner.component";
import { PaginationComponent } from "../../../../shared/pagination/pagination.component";
import { BasePaginatedTable } from '../../../../shared/pagination/base-paginated-table';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, CommonModule, SpinnerComponent, PaginationComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent extends BasePaginatedTable<Customer> implements OnInit {

  // Search filters
  searchEmail: string = '';
  searchFirstName: string = '';
  searchLastName: string = '';
  searchStatus: string = ''; // 'not-blocked' or 'blocked'
  searchPostcode: string = '';
  searchDeliveryZone: string = '';

  constructor(private adminService: AdminService) {
    super()
   }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData(): void {
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
    this.searchStatus = '';
    this.searchPostcode = '';
    this.searchDeliveryZone = '';
    this.applyFilters();
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
}