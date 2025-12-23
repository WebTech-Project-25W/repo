// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // the Express URL of the backend

  constructor(private http: HttpClient) { }

  login(user: string, pass: string): Observable<any> {
    // to match the { user, pass } of the backend
    return this.http.post(`${this.apiUrl}/login`, { "username": user, "password": pass });
  }
}