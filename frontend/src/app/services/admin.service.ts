import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) { }

  getUsers(role: string, searchFilters: any, limit: number, offset: number) {
    let params = new HttpParams();

    params = params.set('role', role);
    // params = params.set('searchFilters', JSON.stringify(searchFilters));

    for (const key in searchFilters) {
      const value = searchFilters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    }

    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/users`, { params });
  }

  getCustomers(
    email?: string,
    firstName?: string,
    lastName?: string,
    status?: string,
    postcode?: string,
    deliveryzone?: string,
    limit?: number,
    offset?: number
  ) {
    let params = new HttpParams();

    if (email) { params = params.set('email', email); }
    if (firstName) { params = params.set('firstName', firstName); }
    if (lastName) { params = params.set('lastName', lastName); }
    if (status) { params = params.set('status', status); }
    if (postcode) { params = params.set('postcode', postcode); }
    if (deliveryzone) { params = params.set('deliveryZone', deliveryzone); }

    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/customers`, { params });
  }

  updateBlockedStatus(userEmail: number, newStatus: string) {
    return this.http.patch(
      `${this.apiUrl}/customers/${userEmail}/blocked-status`,
      { "blockedStatus": newStatus }
    );
  }

  getRestaurants(restaurantId?: number, name?: string, owner?: string, status?: string, address?: string, phoneNum?: string, postcode?: string, cuisine?: string, deliveryzone?: string, limit?: number, offset?: number) {
    let params = new HttpParams();

    if (restaurantId !== undefined) { params = params.set('id', restaurantId); }
    if (name) { params = params.set('name', name); }
    if (owner) { params = params.set('owner', owner); }
    if (status) { params = params.set('status', status); }
    if (address) { params = params.set('address', address); }
    if (phoneNum) { params = params.set('phoneNum', phoneNum); }
    if (postcode) { params = params.set('postcode', postcode); }
    if (cuisine) { params = params.set('cuisine', cuisine); }
    if (deliveryzone) { params = params.set('deliveryZone', deliveryzone); }
    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/restaurants`, { params });
  }

  getLoginLogs(email?: string, status?: string, limit?: number, offset?: number) {
    let params = new HttpParams();

    if (email) { params = params.set('email', email); }
    if (status) { params = params.set('status', status); }
    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/login-logs`, { params });
  }

  getOrderLogs(orderId?: number, email?: string, status?: string, restaurant?: string, limit?: number, offset?: number) {
    let params = new HttpParams();

    if (orderId !== null && orderId !== undefined) { params = params.set('orderId', orderId.toString()); }
    if (email) { params = params.set('customerEmail', email); }
    if (status) { params = params.set('status', status); }
    if (restaurant) { params = params.set('restaurant', restaurant); }
    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/order-logs`, { params });
  }

  updateApprovalStatus(restaurantId: number, newStatus: string) {
    return this.http.patch(
      `${this.apiUrl}/restaurants/${restaurantId}/approval-status`,
      { "approvalStatus": newStatus }
    );
  }

  getKeyStats() {
    return this.http.get<any>(`${this.apiUrl}/key-stats`);
  }

  getVouchers(searchFilters: any, limit: number, offset: number) {
    let params = new HttpParams();

    for (const key in searchFilters) {
      const value = searchFilters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    }

    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/vouchers`, { params });
  }

  putVoucher(id: number, code: string, discount: number, isActive: boolean) {
    const body = {
      code: code,
      discount: discount,
      isActive: isActive,
    }
    return this.http.put<any>(`${this.apiUrl}/voucher/${id}`, body);
  }

  getProfile() {
    return this.http.get<any>(`${this.apiUrl}/profile`)
  }

  updateProfile(firstName?: string, lastName?: string) {
    const body = {
      firstname: firstName,
      lastname: lastName
    };

    return this.http.put<any>(`${this.apiUrl}/profile`, body)
  }
}