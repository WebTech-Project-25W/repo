import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { Restaurant } from '../model/restaurant';
import { LoginLog } from '../model/LoginLog';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) { }


  getUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getRestaurants() {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/restaurants`);
  }

  getLoginLogs(email?: string, status?: string, limit?: number, offset?: number) {
    let params = new HttpParams();

    if (email) { params = params.set('email', email); }
    if (status) { params = params.set('status', status); }
    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<LoginLog[]>(`${this.apiUrl}/login-logs`, { params });
  }

  updateApprovalStatus(restaurantId: number, newStatus: string) {
    return this.http.patch(
      `${this.apiUrl}/restaurants/${restaurantId}/approval-status`,
      { "approvalStatus": newStatus }
    );
  }
}