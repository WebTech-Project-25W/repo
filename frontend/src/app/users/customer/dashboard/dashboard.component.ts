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
searchText: string = '';
selectedCuisine = 'ALL';
selectedEta: 'ALL' | 'UNDER_30' | '30_60' | 'OVER_60' = 'ALL';

constructor(
  private http: HttpClient,
  private router: Router
) {}


ngOnInit(): void {
  this.http
    .get<any>('http://localhost:3000/public/restaurants')
    .subscribe({
      next: data => {
        this.restaurants = (data.restaurants ?? []).map((r: any) => {
          const eta = this.calculateEta(r);
          return {
            ...r,
            etaMin: eta.etaMin,
            etaMax: eta.etaMax,
          };
        });
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

cuisine: string[] = [
    'ALL',
    'italian',
    'asian',
    'austrian'
  ];

get filteredRestaurants() {
  return this.restaurants.filter((r) => {
    const matchesSearch =
      !this.searchText ||
      r.name.toLowerCase().includes(this.searchText.toLowerCase());

    const matchesCuisine =
      this.selectedCuisine === 'ALL' ||
      r.cuisine?.toLowerCase() === this.selectedCuisine.toLowerCase();

    let matchesEta = true;
    if (this.selectedEta !== 'ALL') {
      if (this.selectedEta === 'UNDER_30') {
        matchesEta = r.etaMax <= 30;
      } else if (this.selectedEta === '30_60') {
        matchesEta = r.etaMin >= 30 && r.etaMax <= 60;
      } else if (this.selectedEta === 'OVER_60') {
        matchesEta = r.etaMin >= 60;
      }
    }

    return matchesSearch && matchesCuisine && matchesEta;
  });
}

goToOrders() {
  this.router.navigate(['/customer/orders']);
}

goToProfile() {
  this.router.navigate(['/customer/profile']);
}
private ZONE_TIME: Record<string, number> = {
  A: 15,
  B: 25,
  C: 35,
};

private PREP_TIME = 15;

private calculateEta(r: any) {
  const zone = r.deliveryzone ?? 'B';
  const zoneMin = this.ZONE_TIME[zone] ?? 25;

  const base = this.PREP_TIME + zoneMin;
  return {
    etaMin: Math.max(base - 5, 10),
    etaMax: base + 5,
  };
}

getRoundedRating(value: number): number {
  return Math.floor(value || 0);
}

}