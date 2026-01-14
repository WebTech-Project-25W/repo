import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../services/cart.service';


@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  restaurantId!: number;
  dishes: any[] = [];  
  cartItems: any[] = [];


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.restaurantId = Number(idParam);
    this.cartItems = this.cartService.getItems();

    this.http
      .get<any[]>(`http://localhost:3000/customer/restaurants/${this.restaurantId}/menu`)
      .subscribe({
        next: data => {
          console.log('Menu data:', data);  
          this.dishes = data;
        },
        error: err => {
          console.error('Failed to load menu', err);
        }
      });
  }

  addToCart(dish: any) {
  const existing = this.cartItems.find(
    i => i.dishId === dish.dishid || i.dishId === dish.id
  );

  if (existing) {
    existing.quantity++;
  } else {
    this.cartItems.push({
      dishId: dish.dishid ?? dish.id, 
      name: dish.name,
      price: Number(dish.price),
      quantity: 1
    });
  }

}


get cartTotal(): number {
  return this.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

placeOrder() {

  const payload = {
    restaurantId: this.restaurantId,
    items: this.cartItems.map(item => ({
      dishId: item.dishId,        
      quantity: item.quantity,
      price: item.price
    }))
  };

  console.log('ORDER PAYLOAD =', payload);

   this.http.post('http://localhost:3000/customer/orders', payload)
    .subscribe({
      next: res => {
        console.log('Order created', res);

        this.cartItems = [];

        alert('Order placed successfully!');
      },
      error: err => {
        console.error('Order failed', err);
        alert('Order failed');
      }
    });
}

increaseQuantity(item: any) {
  item.quantity++;
}

decreaseQuantity(item: any) {
  item.quantity--;

  if (item.quantity <= 0) {
    this.removeItem(item);
  }
}

removeItem(item: any) {
  this.cartItems = this.cartItems.filter(
    i => i.dishId !== item.dishId
  );
}

}

