import { Component } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { Restaurant } from '../../../model/restaurant';
import { RestaurantComponent } from "../restaurant/restaurant.component";

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [RestaurantComponent],
  templateUrl: './restaurant-list.component.html',
  styleUrl: './restaurant-list.component.css'
})
export class RestaurantListComponent {
    restaurantList: Restaurant[] = [];
  
    constructor(
      private adminService: AdminService,
    ) { }
  
    ngOnInit(): void {
      this.adminService.getRestaurants().subscribe({
        next: (data: Restaurant[]) => {
          this.restaurantList = data;
          console.log('Restaurants loaded: ', this.restaurantList);
        },
        error: (err) => {
          console.log('Error fetching restauratns: ', err);
        }
      }); 
    }
}
