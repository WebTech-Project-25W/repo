import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePaginatedTable } from '../pagination/base-paginated-table';
import { PublicService } from '../../services/public.service';
import { PaginationComponent } from "../pagination/pagination.component";

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent extends BasePaginatedTable<any> implements OnInit {
  @Input() menuID: any;
  @Input() name?: string;
  @Input() desc?: string;
  @Input() controlsTemplate?: TemplateRef<any> | null = null;

  @Output() dishRated = new EventEmitter<{ dishId: number, rating: number }>();

  constructor(private publicService: PublicService) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData(): void {
    const offset = this.currentPage * this.limit;
    this.publicService.getDishes(
      this.menuID,
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.data = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries)
        console.log('Dishes loaded for menu: '+this.menuID)
      },
      error: (err) => {
        console.error('Error fetching dishes for menu: '+this.menuID)
      }
    })
  }

  getRoundedRating(value: number): number {
    return Math.floor(value || 0);
  }

  onStarClick(dishId: number, rating: number) {
    this.dishRated.emit({ dishId, rating });
  }
}
