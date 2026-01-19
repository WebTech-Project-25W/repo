import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { Restaurant } from '../model/restaurant';

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

  updateApprovalStatus(restaurantId: number, newStatus: string) {
    return this.http.patch(
      `${this.apiUrl}/restaurants/${restaurantId}/approval-status`,
      { "approvalStatus": newStatus }
    );
  }
}