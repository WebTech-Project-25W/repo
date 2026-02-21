import { Component, OnInit } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { OwnerService } from '../../../services/owner.service';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, DragDropModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class OwnerDashboardComponent implements OnInit {
  // ==========================
  // MENUS / DISHES
  // ==========================
  menus: any[] = [];
  dishes: { [menuID: number]: any[] } = {};
  expandedMenus: { [menuID: number]: boolean } = {};
  loading = true;

  onMenuDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const orderedMenuIds = this.menus.map((m) => m.menuid);

    this.ownerService.updateMenuOrder(orderedMenuIds).subscribe({
      error: () => alert('Failed to save menu order'),
    });
  }

  // ==========================
  // ANALYTICS
  // ==========================
  analytics: { today: number; thisWeek: number } | null = null;
  topDishes: { name: string; count: number }[] = [];

  newMenu = {
    name: '',
    description: '',
  };

  newDish: {
    [menuID: number]: {
      name: string;
      description: string;
      price: number;
      photoLink: string;
    };
  } = {};

  // ==========================
  // RESTAURANT
  // ==========================
  restaurant: any = null;
  reviews: any[] = [];
  orderStatusFilter: string = 'all';
  restaurants: any[] = [];
  activeRestaurantId: number | null = null;
  activeDeliveryZones: string[] = [];
  inactiveDeliveryZone = false;

  // ==========================
  // ORDERS  ✅ STEP 2
  // ==========================
  orders: any[] = [];
  ordersLoading = false;
  savedRestaurant: any = null;
  activeSection: 'dashboard' | 'menus' | 'orders' | 'profile' | 'analytics' =
    'dashboard';
  editingDishId: number | null = null;
  editDish: any = {};

  chart: any;

  orderInterval: any;

  constructor(
    private ownerService: OwnerService,
    private authService: AuthService,
    private router: Router,
  ) {}

  // ==========================
  // INIT
  // ==========================
  ngOnInit(): void {
    this.loadRestaurants();
  }

  // ==========================
  // RESTAURANT
  // ==========================
  loadRestaurants(): void {
    this.ownerService.getRestaurants().subscribe({
      next: (res: any) => {
        this.restaurants = res.restaurants ?? [];
      },
      error: () => {
        this.restaurants = [];
      },
    });
  }
  loadActiveDeliveryZones(): void {
    this.ownerService.getActiveDeliveryZones().subscribe({
      next: (res: any) => {
        this.activeDeliveryZones = res?.zones ?? [];

        if (this.restaurant) {
          const current = this.restaurant.deliveryzone;
          this.inactiveDeliveryZone =
            !!current && !this.activeDeliveryZones.includes(current);
        }
      },
      error: (err) => {
        console.error('LOAD ACTIVE ZONES ERROR', err);
        this.activeDeliveryZones = [];
        this.inactiveDeliveryZone = false;
      },
    });
  }

  selectRestaurant(r: any): void {
    this.activeRestaurantId = r.id;
    this.restaurant = { ...r };
    this.savedRestaurant = { ...r };

    this.loadActiveDeliveryZones(); //

    // now load data FOR THIS RESTAURANT
    this.loadMenus();
    this.loadOrders();
    this.loadAnalytics();
    this.loadReviews();

    // start auto-refresh AFTER selection
    this.orderInterval = setInterval(() => {
      this.loadOrders();
    }, 5000);
  }

  loadReviews(): void {
    if (!this.activeRestaurantId) return;

    this.ownerService.getReviews(this.activeRestaurantId).subscribe({
      next: (res: any) => {
        this.reviews = res?.reviews ?? [];
        console.log('REVIEWS LOADED:', this.reviews);
      },
      error: (err) => {
        console.error('REVIEWS ERROR', err);
        this.reviews = [];
      },
    });
  }
  get filteredOrders(): any[] {
    if (this.orderStatusFilter === 'all') {
      return this.orders;
    }

    return this.orders.filter(
      (order) => order.status === this.orderStatusFilter,
    );
  }

  // ==========================
  // MENUS
  // ==========================
  loadMenus(): void {
    this.ownerService.getMenus(this.activeRestaurantId!).subscribe({
      next: (res: any) => {
        this.menus = res?.menus ?? [];
        this.loading = false;

        this.menus.forEach((menu) => {
          this.expandedMenus[menu.menuid] = false;
          this.newDish[menu.menuid] = {
            name: '',
            description: '',
            price: 0,
            photoLink: '',
          };
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleMenu(menuID: number): void {
    this.expandedMenus[menuID] = !this.expandedMenus[menuID];

    if (this.expandedMenus[menuID] && !this.dishes[menuID]) {
      this.loadDishes(menuID);
    }
  }
  loadAnalytics(): void {
    this.ownerService.getOrderAnalytics().subscribe({
      next: (res: any) => {
        this.analytics = res;
      },
    });

    this.ownerService.getTopDishes().subscribe({
      next: (res: any) => {
        this.topDishes = res.topDishes ?? [];
        this.renderChart(); // ✅ render chart after data arrives
      },
    });
  }
  switchSection(section: any): void {
    this.activeSection = section;

    // 🔁 Re-render chart when analytics becomes visible
    if (section === 'analytics') {
      setTimeout(() => {
        this.renderChart();
      }, 0);
    }
  }

  renderChart(): void {
    if (!this.topDishes || this.topDishes.length === 0) return;

    const labels = this.topDishes.map(
      (d: { name: string; count: number }) => d.name,
    );
    const data = this.topDishes.map(
      (d: { name: string; count: number }) => d.count,
    );

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('topDishesChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Orders',
            data,
            backgroundColor: '#1976d2',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }

  // ==========================
  // DISHES
  // ==========================
  loadDishes(menuID: number): void {
    this.ownerService.getDishes(menuID).subscribe({
      next: (res: any) => {
        this.dishes[menuID] = res?.dishes ?? [];
      },
      error: () => {
        this.dishes[menuID] = [];
      },
    });
  }
  startEditDish(dish: any) {
    this.editingDishId = dish.dishid;
    this.editDish = { ...dish }; // clone
  }

  cancelEditDish() {
    this.editingDishId = null;
    this.editDish = {};
  }

  saveDish(menuID: number) {
    const payload = {
      name: this.editDish.name,
      description: this.editDish.description,
      price: this.editDish.price,
      photolink: this.editDish.photoLink, // ✅ rename HERE
    };

    this.ownerService.updateDish(this.editDish.dishid, payload).subscribe({
      next: () => {
        this.loadDishes(menuID);
        this.cancelEditDish();
      },
      error: () => alert('Failed to update dish'),
    });
  }

  addMenu(): void {
    if (!this.newMenu.name.trim()) return;

    this.ownerService.createMenu(this.newMenu).subscribe({
      next: () => {
        this.newMenu = { name: '', description: '' };
        this.loadMenus();
      },
      error: () => alert('Failed to create menu'),
    });
  }

  addDish(menuID: number): void {
    const dish = this.newDish[menuID];
    if (!dish.name || dish.price <= 0) return;

    this.ownerService
      .createDish({
        menuID,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        photoLink: dish.photoLink,
      })
      .subscribe({
        next: () => {
          this.newDish[menuID] = {
            name: '',
            description: '',
            price: 0,
            photoLink: '',
          };
          this.loadDishes(menuID);
        },
        error: () => alert('Failed to create dish'),
      });
  }

  deleteDish(menuID: number, dishID: number): void {
    if (!confirm('Delete this dish?')) return;

    this.ownerService.deleteDish(dishID).subscribe({
      next: () => this.loadDishes(menuID),
      error: () => alert('Failed to delete dish'),
    });
  }

  deleteMenu(menuID: number): void {
    if (!confirm('Delete this menu and all its dishes?')) return;

    this.ownerService.deleteMenu(menuID).subscribe({
      next: () => this.loadMenus(),
      error: () => alert('Failed to delete menu'),
    });
  }

  // ==========================
  // ORDERS  ✅ STEP 2
  // ==========================
  loadOrders(): void {
    this.ordersLoading = true;

    this.ownerService.getOrders().subscribe({
      next: (res: any) => {
        this.orders = res.orders ?? [];
        this.ordersLoading = false;
      },
      error: () => {
        this.ordersLoading = false;
      },
    });
  }

  updateOrderStatus(orderID: number, status: string): void {
    this.ownerService.updateOrderStatus(orderID, status).subscribe({
      next: () => this.loadOrders(),
      error: () => alert('Failed to update order status'),
    });
  }
  // ==========================
  // RESTAURANT SETTINGS
  // ==========================
  saveSettings(): void {
    if (!this.restaurant.deliveryzone) {
      alert('Please select an active delivery zone before saving.');
      return;
    }

    this.ownerService
      .updateRestaurantSettings({
        restaurantID: this.restaurant.restaurantid,
        name: this.restaurant.name,
        phone: this.restaurant.phonenumber,
        openingHours: this.restaurant.openinghours,
        deliveryZone: this.restaurant.deliveryzone,
      })
      .subscribe({
        next: () => {
          this.savedRestaurant = { ...this.restaurant };
          this.inactiveDeliveryZone = false;
          alert('Restaurant settings saved');
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.message || 'Failed to save restaurant settings');
        },
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }

  // ==========================
  // CREATE TEST ORDER (DEMO)
  // ==========================
  addTestOrder(): void {
    this.ownerService.createTestOrder().subscribe({
      next: () => {
        this.loadOrders();
      },
      error: () => {
        alert('Failed to create test order');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.orderInterval) {
      clearInterval(this.orderInterval);
    }
  }
}
