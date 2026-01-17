import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OwnerService {
  private apiUrl = 'http://localhost:3000';

  private baseUrl = 'http://localhost:3000/owner';

  constructor(private http: HttpClient) {}

  // ===============================
  // AUTH HEADER (JWT)
  // ===============================
  private authHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // ===============================
  // MENUS
  // ===============================
  getMenus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/menus`, this.authHeaders());
  }

  createMenu(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/menus`, data, this.authHeaders());
  }

  /*
   * NOT IMPLEMENTED IN BACKEND
   * --------------------------------
   * There is NO:
   *   PUT    /owner/menus/:menuID
   *   DELETE /owner/menus/:menuID
   * in restaurantOwner.js
   *
   * These methods are intentionally commented out
   * to avoid frontend calling non-existing endpoints.
   */

  // updateMenu(menuID: number, data: any): Observable<any> {
  //   return this.http.put(`${this.baseUrl}/menus/${menuID}`, data, this.authHeaders());
  // }

  // deleteMenu(menuID: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/menus/${menuID}`, this.authHeaders());
  // }

  // ===============================
  // DISHES
  // ===============================
  getDishes(menuID: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/dishes/${menuID}`,
      this.authHeaders(),
    );
  }

  createDish(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dishes`, data, this.authHeaders());
  }
  updateDish(dishID: number, data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/dishes/${dishID}`,
      data,
      this.authHeaders(),
    );
  }

  /*
   * NOT IMPLEMENTED IN BACKEND
   * --------------------------------
   * There is NO:
   *   PUT    /owner/dishes/:dishID
   *   DELETE /owner/dishes/:dishID
   */

  // updateDish(dishID: number, data: any): Observable<any> {
  //   return this.http.put(`${this.baseUrl}/dishes/${dishID}`, data, this.authHeaders());
  // }

  // deleteDish(dishID: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/dishes/${dishID}`, this.authHeaders());
  // }

  // ===============================
  // ORDERS
  // ===============================
  getOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders`, this.authHeaders());
  }

  updateOrderStatus(orderID: number, status: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/orders/${orderID}/status`,
      { status },
      this.authHeaders(),
    );
  }

  // ===============================
  // RESTAURANT PROFILE
  // ===============================
  getRestaurant(): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurant`, this.authHeaders());
  }

  updateRestaurantSettings(data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/restaurant/settings`,
      data,
      this.authHeaders(),
    );
  }

  // ===============================
  // ANALYTICS
  // ===============================
  getTopDishes(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/analytics/top-dishes`,
      this.authHeaders(),
    );
  }

  /*
   * FIXED ENDPOINT NAME
   * --------------------------------
   * Backend route:
   *   GET /owner/analytics/orders
   * NOT:
   *   /analytics/orders-stats
   */
  getOrderStats(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/analytics/orders`,
      this.authHeaders(),
    );
  }
  deleteMenu(menuID: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/menus/${menuID}`,
      this.authHeaders(),
    );
  }

  deleteDish(dishID: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/dishes/${dishID}`,
      this.authHeaders(),
    );
  }
  getOrderAnalytics(): Observable<{
    today: number;
    thisWeek: number;
  }> {
    return this.http.get<{
      today: number;
      thisWeek: number;
    }>(`${this.baseUrl}/analytics/orders`, this.authHeaders());
  }

  // ===== TEST ORDER (DEMO) =====
  createTestOrder(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/orders/test`,
      {},
      this.authHeaders(),
    );
  }
}
