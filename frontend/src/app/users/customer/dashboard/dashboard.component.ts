import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PasswordResetComponent } from "../../password-reset/password-reset.component";
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from "../../../shared/pagination/pagination.component";
import { BasePaginatedTable } from '../../../shared/pagination/base-paginated-table';
import { PublicService } from '../../../services/public.service';



@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PasswordResetComponent, FormsModule, PaginationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class CustomerDashboardComponent extends BasePaginatedTable<any> implements OnInit{
searchName?: string;
searchCuisine?: string = '';
selectedEta: 'ALL' | 'UNDER_30' | '30_60' | 'OVER_60' = 'ALL';
sortByRating: 'desc' | 'asc' | null = null;

constructor(
  private router: Router,
  private publicService: PublicService
) {
  super()
}


ngOnInit(): void {
  this.loadData();
}

override loadData(): void {
  const offset = this.currentPage * this.limit;
  const sortBy = (this.sortByRating) ? 'rating' : undefined;

  this.publicService.getRestaurants(this.searchName, this.searchCuisine, undefined ,sortBy, this.sortByRating, this.limit, offset)
  .subscribe({
    next: resp => {
      this.data = (resp.data ?? []).map((r: any) => {
        const eta = this.calculateEta(r);
        return {
          ...r,
          etaMin: eta.etaMin,
          etaMax: eta.etaMax,
        };
      });
      this.totalEntries = parseInt(resp.metadata.totalEntries);
    },
    error: err => {
      console.error('Failed to load restaurants', err);
      this.data = [];
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
  let result = this.data.filter((r) => {
    let matchesEta = true;

if (this.selectedEta !== 'ALL') {
  const min = r.etaMin;
  const max = r.etaMax;

  if (this.selectedEta === 'UNDER_30') {
    matchesEta = min < 30;
  } 
  else if (this.selectedEta === '30_60') {

    matchesEta = max > 30 && min < 60;
  } 
  else if (this.selectedEta === 'OVER_60') {
    matchesEta = max > 60;
  }
}


    return matchesEta;
  });

  if (this.sortByRating) {
    result = result.sort((a, b) => {
      const aRating = a.averageRating ?? 0;
      const bRating = b.averageRating ?? 0;

      return this.sortByRating === 'desc'
        ? bRating - aRating
        : aRating - bRating;
    });
  }

  return result;
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

sortRestaurantsByRating() {
  if (!this.sortByRating) return;

  this.data = [...this.data].sort((a, b) => {
    const aRating = a.averageRating || 0;
    const bRating = b.averageRating || 0;

    if (this.sortByRating === 'desc') {
      return bRating - aRating; 
    }

    return aRating - bRating;
  });
}


}