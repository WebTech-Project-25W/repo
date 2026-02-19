import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  @Input() menu: any;
  @Input() controlsTemplate?: TemplateRef<any> | null =null;

  @Output() dishRated = new EventEmitter<{ dishId: number, rating: number }>();


  getRoundedRating(value: number): number {
    return Math.floor(value || 0);
  }

  onStarClick(dishId: number, rating: number) {
    this.dishRated.emit({ dishId, rating });
  }
}
