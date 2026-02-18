import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private apiUrl = 'http://localhost:3000/public';

  constructor(private http: HttpClient) { }
  
  getRestaurants(name?: string, cuisine?: string, searchHours?: string, sortBy?: string, sortDirection?: string | null, limit?: number, offset?: number) {
    let params = new HttpParams();

    if (name !== undefined && name !== '') { params = params.set('name', name); }
    if (cuisine !== undefined && cuisine !== '') { params = params.set('cuisine', cuisine); }
    if (searchHours !== undefined && searchHours !== '') { params = params.set('searchHours', searchHours); }
    if (sortBy !== undefined) { params = params.set('sortBy', sortBy); }
    if (sortDirection !== undefined && sortDirection !== null) { params = params.set('sortDirection', sortDirection); }
    
    if (limit !== undefined) { params = params.set('limit', limit.toString()); }
    if (offset !== undefined) { params = params.set('offset', offset.toString()); }

    return this.http.get<any>(`${this.apiUrl}/restaurants`, { params });
  }

}