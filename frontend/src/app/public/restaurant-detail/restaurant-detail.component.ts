import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css'],
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: any = null;
  menus: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // restaurant info
    this.http
      .get<any>(`http://localhost:3000/public/restaurants/${id}`)
      .subscribe((res) => (this.restaurant = res.restaurant));

    // menus
    this.http
      .get<any>(`http://localhost:3000/public/restaurants/${id}/menus`)
      .subscribe((res) => (this.menus = res.menus));
  }
}
