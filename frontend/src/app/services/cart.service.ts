import { Injectable } from '@angular/core';

export interface CartItem {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items: CartItem[] = [];

  getItems(): CartItem[] {
    return this.items;
  }

  addToCart(dish: any) {
    const existing = this.items.find(i => i.dishId === dish.dishid);

    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({
        dishId: dish.dishid,
        name: dish.name,
        price: dish.price,
        quantity: 1
      });
    }
  }

  removeFromCart(dishId: number) {
    this.items = this.items.filter(i => i.dishId !== dishId);
  }

  clearCart() {
    this.items = [];
  }

  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}
