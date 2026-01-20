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
  // MENUS
  // ===============================
  getMenus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/menus`);
  }

  createMenu(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/menus`, data);
  }
  getRestaurants(): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants`);
  }
  getMyRestaurants(): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants`);
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
  //   return this.http.put(`${this.baseUrl}/menus/${menuID}`, data);
  // }

  // deleteMenu(menuID: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/menus/${menuID}`);
  // }

  // ===============================
  // DISHES
  // ===============================
  getDishes(menuID: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dishes/${menuID}`);
  }

  createDish(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dishes`, data);
  }
  updateDish(dishID: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/dishes/${dishID}`, data);
  }

  /*
   * NOT IMPLEMENTED IN BACKEND
   * --------------------------------
   * There is NO:
   *   PUT    /owner/dishes/:dishID
   *   DELETE /owner/dishes/:dishID
   */

  // updateDish(dishID: number, data: any): Observable<any> {
  //   return this.http.put(`${this.baseUrl}/dishes/${dishID}`, data);
  // }

  // deleteDish(dishID: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/dishes/${dishID}`);
  // }

  // ===============================
  // ORDERS
  // ===============================
  getOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders`);
  }

  updateOrderStatus(orderID: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/orders/${orderID}/status`, {
      status,
    });
  }

  // ===============================
  // RESTAURANT PROFILE
  // ===============================
  getRestaurant(): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurant`);
  }

  updateRestaurantSettings(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/restaurant/settings`, data);
  }

  // ===============================
  // ANALYTICS
  // ===============================
  getTopDishes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/top-dishes`);
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
    return this.http.get(`${this.baseUrl}/analytics/orders`);
  }
  deleteMenu(menuID: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/menus/${menuID}`);
  }

  deleteDish(dishID: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/dishes/${dishID}`);
  }
  getOrderAnalytics(): Observable<{
    today: number;
    thisWeek: number;
  }> {
    return this.http.get<{
      today: number;
      thisWeek: number;
    }>(`${this.baseUrl}/analytics/orders`);
  }

  // ===== TEST ORDER (DEMO) =====
  createTestOrder(): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/test`, {});
  }
}
