import { Component } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [FormsModule],
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