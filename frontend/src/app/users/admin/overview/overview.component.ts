import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  totalOrders?: number;
  revenue?: number;
  totalLogins?: number;
  totalMealsDelivered?: number;

  isLoadingStats = true;

  constructor(
    private adminService: AdminService,
  ) { }

  ngOnInit(): void {
    this.adminService.getKeyStats().subscribe({
      next: (data) => {
        this.totalOrders = data.totalOrders;
        this.revenue = data.revenueCents;
        this.totalLogins = data.totalLogins;
        this.totalMealsDelivered = data.totalMealsDelivered;
        
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Could not load dashboard stats', err);
        this.isLoadingStats =false;
      }
    });
  }



  getTotalRevenue() {
    return this.revenue;
  }

}
