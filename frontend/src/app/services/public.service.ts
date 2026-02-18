import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private apiUrl = 'http://localhost:3000/public';

  constructor(private http: HttpClient) { }
  
  getRestaurants(limit: number, offset: number) {
    let params = new HttpParams();

    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/restaurants`, { params });
  }

}