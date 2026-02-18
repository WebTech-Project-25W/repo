import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { Restaurant } from '../../../model/restaurant';
import { finalize } from 'rxjs';
import { SpinnerComponent } from "../../../shared/spinner/spinner.component";
import { BasePaginatedTable } from '../../../shared/pagination/base-paginated-table';
import { PaginationComponent } from "../../../shared/pagination/pagination.component";

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [FormsModule, CommonModule, SpinnerComponent, PaginationComponent],
  templateUrl: './restaurants.component.html',
  styleUrl: './restaurants.component.css'
})
export class RestaurantsComponent extends BasePaginatedTable<any> implements OnInit {

  // Search filters
  searchRestaurantId?: string = undefined;
  searchName: string = '';
  searchOwner: string = '';
  searchStatus: string = '';
  searchAddress: string = '';
  searchPhoneNum: string = '';
  searchPostcode: string = '';
  searchCuisine: string = '';
  searchDeliveryZone: string = '';

  constructor(private adminService: AdminService) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getRestaurants(
      this.searchRestaurantId,
      this.searchName,
      this.searchOwner,
      this.searchStatus,
      this.searchAddress,
      this.searchPhoneNum,
      this.searchPostcode,
      this.searchCuisine,
      this.searchDeliveryZone,
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.data = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
        console.log('restaurants loaded:', resp);
      },
      error: (err) => {
        console.error('Error fetching restaurants:', err);
      }
    });
  }

  serviceFeeToString(restaurant: Restaurant): string {
    if (!restaurant.serviceFeeType || !restaurant.serviceFee) {
      return '';
    }

    if (restaurant.serviceFeeType === 'cents') {
      return (restaurant.serviceFee / 100).toLocaleString('en-GB', {
        style: 'currency',
        currency: 'EUR',
      });
    }

    if (restaurant.serviceFeeType === 'percent') {
      return restaurant.serviceFee + '%';
    }

    return '';
  }


  editServiceFee(restaurant: any) {
    restaurant.updateServiceFee = (restaurant.serviceFeeType === 'percent') ? restaurant.serviceFee : restaurant.serviceFee / 100;
    restaurant.updateServiceFeeType = restaurant.serviceFeeType;
    restaurant.isEditingServiceFee = true;
  }

  saveServiceFee(restaurant: any) {
    // only update if changed
    if (restaurant.serviceFee !== restaurant.updateServiceFee || restaurant.serviceFeeType !== restaurant.updateServiceFeeType) {
      let updateServiceFee = (restaurant.updateServiceFee) ? restaurant.updateServiceFee : 0;
      updateServiceFee = (restaurant.updateServiceFeeType === 'cents') ? updateServiceFee * 100 : updateServiceFee;

      restaurant.isUpdatingServiceFee = true;
      this.adminService.updateServiceFee(restaurant.id, updateServiceFee, restaurant.updateServiceFeeType)
        .pipe(
          finalize(() => {
            restaurant.isUpdatingServiceFee = false;
            restaurant.isEditingServiceFee = false;
          })
        )
        .subscribe({
          next: (resp: any) => {
            restaurant.serviceFee = resp.serviceFee;
            restaurant.serviceFeeType = resp.serviceFeeType;
          },
          error: (err: any) => {
            console.error(err.error);
          },
        })

    } else {
      restaurant.isEditingServiceFee = false;
    }

    return;
  }
  applyFilters(): void {
    this.currentPage = 0;
    this.loadData();
  }

  clearFilters(): void {
    this.searchRestaurantId = undefined;
    this.searchName = '';
    this.searchOwner = '';
    this.searchAddress = '';
    this.searchPostcode = '';
    this.searchPhoneNum = '';
    this.searchCuisine = '';
    this.searchDeliveryZone = '';
    this.searchStatus = '';
    this.applyFilters();
  }

  onStatusChange(event: any, restaurant: any) {

    const oldValue = restaurant.approvalstatus;
    const newValue = event.target.value;
    restaurant.isUpdatingStatus = true;

    this.adminService.updateApprovalStatus(restaurant.id, newValue)
      .subscribe({
        next: (response: any) => {
          restaurant.approvalstatus = response.approvalstatus;
          restaurant.isUpdatingStatus = false;
        },
        error: (err) => {
          event.target.value = oldValue;
          restaurant.isUpdatingStatus = false;
          alert('failed to update status of restaurant: ' + restaurant.id);
        }
      })
  }

  isTransitionAllowed(currentStatus: string, targetStatus: string): boolean {
    // Always allow keeping the current status
    if (currentStatus === targetStatus) return true;

    switch (currentStatus) {
      case 'pending':
        // From pending, you can only go to approved or rejected
        return ['approved', 'rejected'].includes(targetStatus);
      case 'approved':
        // From approved, you can only suspend
        return targetStatus === 'suspended';
      case 'suspended':
        // From suspended, you can only go back to approved
        return targetStatus === 'approved';
      case 'rejected':
        // rejected is a final state
        return false;
      default:
        return false;
    }
  }

  checkNumber(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.value.trim() === '' || isNaN(Number(input.value)) || !Number.isInteger(Number(input.value))) {
      this.searchRestaurantId = undefined;
      input.value = '';
    }
  }
}