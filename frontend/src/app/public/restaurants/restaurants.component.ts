import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './restaurants.component.html',
  styleUrls: ['./restaurants.component.css'],
})
export class RestaurantsComponent implements OnInit {
  restaurants: any[] = [];
  myRestaurantId: number | null = null;
  loading = true;

  // 🔍 search text
  search = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadRestaurants();
    this.loadOwnerRestaurant();
  }

  loadRestaurants() {
    this.http.get<any>('http://localhost:3000/public/restaurants').subscribe({
      next: (res) => {
        this.restaurants = res.restaurants;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadOwnerRestaurant() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http
      .get<any>('http://localhost:3000/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res) => {
          if (res.restaurant) {
            this.myRestaurantId = res.restaurant.id;
          }
        },
        error: () => {},
      });
  }

  // ✅ search by NAME + OPENING HOURS
  get filteredRestaurants() {
    const q = this.search.toLowerCase();

    return this.restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.openinghours && r.openinghours.toLowerCase().includes(q))
    );
  }

  openRestaurant(id: number) {
    this.router.navigate(['/restaurants', id]);
  }
}
