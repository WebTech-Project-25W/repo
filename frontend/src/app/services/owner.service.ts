import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private baseUrl = 'http://localhost:3000/owner';

  constructor(private http: HttpClient) {}

  private authHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // ===== MENUS =====
  getMenus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/menus`, this.authHeaders());
  }

  createMenu(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/menus`, data, this.authHeaders());
  }

  updateMenu(menuID: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/menus/${menuID}`, data, this.authHeaders());
  }

  deleteMenu(menuID: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/menus/${menuID}`, this.authHeaders());
  }

  // ===== DISHES =====
  getDishes(menuID: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dishes/${menuID}`, this.authHeaders());
  }

  createDish(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dishes`, data, this.authHeaders());
  }

  updateDish(dishID: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/dishes/${dishID}`, data, this.authHeaders());
  }

  deleteDish(dishID: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/dishes/${dishID}`, this.authHeaders());
  }

  // ===== ORDERS =====
  getOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders`, this.authHeaders());
  }

  updateOrderStatus(orderID: number, status: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/orders/${orderID}/status`,
      { status },
      this.authHeaders()
    );
  }

  // ===== PROFILE =====
  getRestaurant(): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurant`, this.authHeaders());
  }

  updateRestaurantSettings(data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/restaurant/settings`,
      data,
      this.authHeaders()
    );
  }

  // ===== ANALYTICS =====
  getTopDishes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/top-dishes`, this.authHeaders());
  }

  getOrderStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/orders-stats`, this.authHeaders());
  }
}
