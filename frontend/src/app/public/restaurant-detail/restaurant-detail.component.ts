import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule} from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css'],
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: any = null;
  menus: any[] = [];
  cart: { dish: any; quantity: number }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  isCustomerView = false;

  ngOnInit(): void {
    this.isCustomerView = this.router.url.startsWith('/customer');
    const id = this.route.snapshot.paramMap.get('id');

    // restaurant info
    this.http
      .get<any>(`http://localhost:3000/public/restaurants/${id}`)
      .subscribe((res) => (this.restaurant = res.restaurant));

    // menus
    this.http
      .get<any>(`http://localhost:3000/public/restaurants/${id}/menus`)
      .subscribe((res) => (this.menus = res.menus));
  }

get cartTotal(): number {
  return this.cart.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );
}

get isCustomer(): boolean {
  return this.router.url.startsWith('/customer');
}

increase(dish: any) {
  const item = this.cart.find(i => i.dish.id === dish.id);

  if (item) {
    item.quantity++;
  } else {
    this.cart.push({
      dish: dish, 
      quantity: 1
    });
  }
}

decrease(dish: any) {
  const item = this.cart.find(i => i.dish.id === dish.id);
  if (!item) return;

  item.quantity--;

  if (item.quantity <= 0) {
    this.cart = this.cart.filter(i => i.dish.id !== dish.id);
  }
}
getQuantity(dish: any): number {
  const item = this.cart.find(i => i.dish.id === dish.id);
  return item ? item.quantity : 0;
}

remove(item: any) {
  this.cart = this.cart.filter(i => i.dish.id !== item.dish.id);
}

placeOrder() {
  const payload = {
    restaurantId: this.restaurant.id,
    items: this.cart.map(c => ({
      dishId: c.dish.dishid, 
      quantity: c.quantity,
      price: c.dish.price
    }))
  };

  this.http.post(
    'http://localhost:3000/customer/orders',
    payload
  ).subscribe({
    next: res => {
      alert('Order placed successfully');
      console.log('Order created', res);
      this.cart = [];
    },
    error: err => {
      console.error('Order failed', err);
      alert('Failed to place order');
    }
  });
}
}
