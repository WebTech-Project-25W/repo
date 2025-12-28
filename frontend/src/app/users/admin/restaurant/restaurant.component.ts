import { Component, Input } from '@angular/core';
import { Restaurant } from '../../../model/restaurant';

@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [],
  templateUrl: './restaurant.component.html',
  styleUrl: './restaurant.component.css'
})
export class RestaurantComponent {
  @Input() restaurant!: Restaurant;

}
