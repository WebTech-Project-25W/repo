import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // the Express URL of the backend

  constructor(private http: HttpClient) { }

<<<<<<< HEAD
  //login(user: string, pass: string): Observable<any> {
    // to match the { user, pass } of the backend
    //return this.http.post(`${this.apiUrl}/login`, { "username": user, "password": pass });
  //}
login(username: string, password: string) {
  return this.http.post<any>(
    `${this.apiUrl}/auth/login`,
    { username, password }
  );
}
=======
  login(email: string, pass: string): Observable<any> {
    // to match the { email, pass } of the backend
    return this.http.post(`${this.apiUrl}/login`, { "email": email, "password": pass });
  }
>>>>>>> a8a262200d6d7f35aee789d4ddfb565345f56d56

  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    address: string,
    postcode: string,
    phoneNumber: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      "email": email,
      "password": password,
      "firstName": firstName,
      "lastName": lastName,
      "address": address,
      "postcode": postcode,
      "phoneNumber": phoneNumber
    });
  }

  resetPassword(newPassword: string): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })

    return this.http.post(`${this.apiUrl}/reset-password`,
      { "password": newPassword },
      { headers }
    );
  }
}