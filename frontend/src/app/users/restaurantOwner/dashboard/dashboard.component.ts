import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { OwnerService } from '../../../services/owner.service';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    NgIf,     // ✅ REQUIRED for *ngIf
    NgFor     // ✅ REQUIRED for *ngFor
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class OwnerDashboardComponent implements OnInit {
  menus: any[] = [];
  dishes: { [menuID: number]: any[] } = {};
  loading = true;

  constructor(private ownerService: OwnerService) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus() {
    this.ownerService.getMenus().subscribe({
      next: (res: any) => {
        this.menus = res.menus;
        this.loading = false;

        this.menus.forEach(menu => {
          this.loadDishes(menu.menuid);
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDishes(menuID: number) {
    this.ownerService.getDishes(menuID).subscribe({
      next: (res: any) => {
        this.dishes[menuID] = res.dishes;
      }
    });
  }
}
