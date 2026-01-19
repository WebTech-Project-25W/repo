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
  
restaurants: any[] = [];

constructor(
  private http: HttpClient,
  private router: Router
) {}


ngOnInit(): void {
  this.http
    .get<any[]>('http://localhost:3000/customer/restaurants')
    .subscribe({
      next: data => {
        this.restaurants = data;
      },
      error: err => {
        console.error('Failed to load restaurants', err);
      }
    });
}

openRestaurant(restaurantId: number) {
  console.log('Clicked restaurant id:', restaurantId);
  this.router.navigate(['/customer/restaurants', restaurantId]);
}
search: string = '';
selectedCuisine: string = 'ALL';

get filteredRestaurants() {
  const q = this.search.toLowerCase();

  return this.restaurants.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(q);

    const matchesCuisine =
      this.selectedCuisine === 'ALL' ||
      r.cuisine?.toLowerCase() === this.selectedCuisine;

    return matchesSearch && matchesCuisine;
  });
}




}