import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from "../../shared/menu/menu.component";

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MenuComponent],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css'],
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: any = null;
  menus: any[] = [];
  cart: { dish: any; quantity: number }[] = [];
  averageRating: number = 0;
  ratingCount: number = 0;
  dishRatings: {
    [dishId: number]: { average: number; count: number }
  } = {};
  reviewText: string = '';
  reviews: any[] = [];
  voucherCode: string = '';
  discountAmount: number = 0;
  finalTotal: number | null = null;
  voucherMessage: string = '';
  @ViewChildren(MenuComponent) menuComponents!: QueryList<MenuComponent>;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  isCustomerView = false;

  ngOnInit(): void {
    this.isCustomerView = this.router.url.startsWith('/customer');
    const id = this.route.snapshot.paramMap.get('id');

    this.restoreCart();

    // restaurant info
    this.http
      .get<any>(`http://localhost:3000/public/restaurants/${id}`)
      .subscribe((res) => {
    this.restaurant = res.restaurant;
    this.loadRestaurantReviews();
    });
    // menus
    this.http
  .get<any>(`http://localhost:3000/public/restaurants/${id}/menus`)
  .subscribe((res) => {
    this.menus = res.menus;
  });

  
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
  const item = this.cart.find(i => i.dish.dishid === dish.dishid);

  if (item) {
    item.quantity++;
  } else {
    this.cart.push({
      dish: dish, 
      quantity: 1
    });
    this.saveCart();
  }
}

decrease(dish: any) {
  const item = this.cart.find(i => i.dish.dishid === dish.dishid);

  if (!item) return;

  item.quantity--;

  if (item.quantity <= 0) {
   this.cart = this.cart.filter(i => i.dish.dishid !== dish.dishid);
  }
  this.saveCart();
}

getQuantity(dish: any): number {
  const item = this.cart.find(i => i.dish.dishid === dish.dishid);

  return item ? item.quantity : 0;
}

remove(item: any) {
  this.cart = this.cart.filter(i => i.dish.dishid !== item.dish.dishid);
  this.saveCart();
}

placeOrder() {

  const originalTotal = this.cartTotal;

  const finalTotal =
    this.finalTotal !== null ? this.finalTotal : originalTotal;

  const discountRatio =
    originalTotal > 0 ? finalTotal / originalTotal : 1;

  const payload = {
    restaurantId: this.restaurant.id,
    items: this.cart.map(c => ({
      dishId: c.dish.dishid,
      quantity: c.quantity,

      price: +(c.dish.price * discountRatio).toFixed(2)
    }))
  };

  this.http.post(
    'http://localhost:3000/customer/orders',
    payload
  ).subscribe({
    next: res => {
      alert('Order placed successfully');

      this.cart = [];
      localStorage.removeItem('offline_cart');
      this.finalTotal = null;
      this.discountAmount = 0;
      this.voucherCode = '';
      this.voucherMessage = '';
    },
    error: err => {
      console.error('Order failed', err);
      alert('Failed to place order');
    }
  });
}


getRoundedRating(value: number): number {
  return Math.floor(value || 0);
}

rateRestaurant(star: number) {
  this.http.post<any>(
    "http://localhost:3000/customer/ratings/restaurant",
    {
      restaurantId: this.restaurant.id,
      rating: star,
    }
  ).subscribe({
    next: (res) => {
      this.averageRating = res.average;
      this.ratingCount = res.count;
    },
    error: () => {
      alert("Failed to submit rating");
    }
  });
}

refreshRestaurantRating() {
  const id = this.route.snapshot.paramMap.get('id');

  this.http
    .get<any>(`http://localhost:3000/public/restaurants/${id}/ratings`)
    .subscribe({
      next: (res) => {
        this.averageRating = res.average;
        this.ratingCount = res.count;
      },
      error: (err) => {
        console.error('Failed to load restaurant rating', err);
      }
    });
}

rateDish(event: { menuID: number, dishId: number, rating: number}) {
const dishId = event.dishId;
const star = event.rating;

  this.http.post(
    "http://localhost:3000/customer/ratings/dish",
    {
      dishId,
      rating: star
    }
  ).subscribe({
    next: () => {
     const target = this.menuComponents.find(m => m.menuID === event.menuID);
     // trigger menu component to reload its data when dish rating event is sent out
     target?.loadData()
    },
    error: () => {
      alert("Failed to submit dish rating");
    }
  });
}

submitReview() {
  if (!this.restaurant?.id) {
    alert('Restaurant not loaded yet');
    return;
  }
  
  
  this.http.post(
    'http://localhost:3000/customer/reviews',
    {
      restaurantId: this.restaurant.id,
      rating: Math.round(this.averageRating || 0),
      description: this.reviewText
    }
  ).subscribe({
    next: () => {
      this.reviewText = '';
      this.loadRestaurantReviews();
    },
    error: () => {
      alert('Failed to submit review');
    }
  });
}

loadRestaurantReviews() {
  if (!this.restaurant?.id) {
    return;
  }

  this.http.get<any>(
    `http://localhost:3000/public/reviews/${this.restaurant.id}`
  ).subscribe({
    next: (res) => {
      this.reviews = res.reviews;
    },
    error: () => {
      console.error('Failed to load reviews');
    }
  });
}

applyVoucher() {
  if (!this.voucherCode) return;

  this.http.post<any>(
    'http://localhost:3000/customer/voucher',
    {
      code: this.voucherCode,
      orderTotal: this.cartTotal
    }
  ).subscribe({
    next: (res) => {
      if (res.valid) {
        this.discountAmount = res.discountAmount;
        this.finalTotal = res.finalTotal;
        this.voucherMessage = `Voucher applied: -${res.discountAmount} €`;
      } else {
        this.discountAmount = 0;
        this.finalTotal = null;
        this.voucherMessage = res.message;
      }
    },
    error: () => {
      this.voucherMessage = 'Voucher validation failed';
    }
  });
}

saveCart() {
  const restaurantId = this.restaurant?.id;
  if (!restaurantId) return;

  const key = `offline_cart_${restaurantId}`;
  localStorage.setItem(key, JSON.stringify(this.cart));
}

restoreCart() {
  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;

  const key = `offline_cart_${id}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    this.cart = JSON.parse(saved);
  } else {
    this.cart = [];
  }
}


}
