import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BasePaginatedTable } from '../../shared/pagination/base-paginated-table';
import { PublicService } from '../../services/public.service';
import { PaginationComponent } from "../../shared/pagination/pagination.component";

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './restaurants.component.html',
  styleUrls: ['./restaurants.component.css'],
})
export class RestaurantsComponent extends BasePaginatedTable<any> implements OnInit {
  myRestaurantId: number | null = null;
  loading = true;

  // 🔍 search text
  search = '';

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private publicService: PublicService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadOwnerRestaurant();
  }

  override loadData(): void {
  const offset = this.currentPage * this.limit;

  this.publicService.getRestaurants(this.limit, offset)
  .subscribe({
    next: resp => {
      this.data = (resp.data ?? []);
      this.totalEntries = parseInt(resp.metadata.totalEntries);
    },
    error: err => {
      console.error('Failed to load restaurants', err);
      this.data = [];
    }
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

    return this.data.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.openinghours && r.openinghours.toLowerCase().includes(q))
    );
  }

  openRestaurant(id: number) {
    this.router.navigate(['/restaurants', id]);
  }
}
