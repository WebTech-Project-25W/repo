import { Component } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { Restaurant } from '../../../model/restaurant';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './restaurants.component.html',
  styleUrl: './restaurants.component.css'
})
export class RestaurantsComponent {
  restaurants: any[] = [];

  // Pagination config
  limit: number = 10;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchRestaurantId?: number = undefined;
  searchName: string = '';
  searchOwner: string = '';
  searchStatus: string = '';
  searchAddress: string = '';
  searchPhoneNum: string = '';
  searchPostcode: string = '';
  searchCuisine: string = '';
  searchDeliveryZone: string = '';


  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.restaurants.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadRestaurants(): void {
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
        this.restaurants = resp.data;
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
      return (restaurant.serviceFee/100).toLocaleString('en-GB', {
        style: 'currency',
        currency: 'EUR',
      });
    }
    
    if (restaurant.serviceFeeType === 'percent') {
      return restaurant.serviceFee+'%';
    }
    
    return '';
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadRestaurants();
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

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadRestaurants();
  }

  onStatusChange(event: any, restaurant: any) {

    const oldValue = restaurant.approvalstatus;
    const newValue = event.target.value;
    restaurant.isUpdating = true;

    this.adminService.updateApprovalStatus(restaurant.id, newValue)
      .subscribe({
        next: (response: any) => {
          restaurant.approvalstatus = response.approvalstatus;
          restaurant.isUpdating = false;
        },
        error: (err) => {
          event.target.value = oldValue;
          restaurant.isUpdating = false;
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

  nextPage(): void {
    // Prevent navigating past the last page
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadRestaurants();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadRestaurants();
    }
  }
}