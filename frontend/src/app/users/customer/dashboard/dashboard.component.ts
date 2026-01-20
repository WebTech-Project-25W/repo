import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule,RouterModule,PasswordResetComponent,FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CustomerDashboardComponent implements OnInit{
activeSection: 'restaurants' | 'orders' | 'profile' = 'restaurants';
restaurants: any[] = [];

constructor(
  private http: HttpClient,
  private router: Router
) {}


ngOnInit(): void {
  this.http
  .get<any>('http://localhost:3000/public/restaurants')
  .subscribe({
    next: data => {
      this.restaurants = data.restaurants ?? [];
    },
    error: err => {
      console.error('Failed to load restaurants', err);
      this.restaurants = [];
    }
  });
}

openRestaurant(restaurantId: number) {
  this.router.navigate(['/customer/restaurants', restaurantId]);
}
searchText: string = '';
selectedCuisine = 'ALL';

cuisines: string[] = [
    'ALL',
    'italian',
    'asian',
    'austrian'
  ];

get filteredRestaurants() {
  if (!Array.isArray(this.restaurants)) {
    return [];
  }

  return this.restaurants.filter(r => {
    const matchesSearch =
      !this.searchText ||
      r.name.toLowerCase().includes(this.searchText.toLowerCase());

    const matchesCuisine =
      this.selectedCuisine === 'ALL' ||
      r.cuisine?.toLowerCase() === this.selectedCuisine.toLowerCase();

    return matchesSearch && matchesCuisine;
  });
}



goToOrders() {
  this.router.navigate(['/customer/orders']);
}

goToProfile() {
  this.router.navigate(['/customer/profile']);
}
}