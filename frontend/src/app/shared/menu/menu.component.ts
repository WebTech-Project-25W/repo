import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePaginatedTable } from '../pagination/base-paginated-table';
import { PublicService } from '../../services/public.service';
import { PaginationComponent } from "../pagination/pagination.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, PaginationComponent, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent extends BasePaginatedTable<any> implements OnInit {

  @Input() menuID: any;
  @Input() name?: string;
  @Input() desc?: string;
  @Input() controlsTemplate?: TemplateRef<any> | null = null;

  @Output() dishRated = new EventEmitter<{ menuID: number, dishId: number, rating: number }>();

  searchTerm?: string;
  inputSortBy?: string | null = null;
  sortByField?: string;
  sortByDirection?: string;

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
      this.searchTerm,
      this.sortByField,
      this.sortByDirection,
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.data = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries)
        console.log('Dishes loaded for menu: ' + this.menuID)
      },
      error: (err) => {
        console.error('Error fetching dishes for menu: ' + this.menuID)
      }
    })
  }

  clearOffsetAndloadData() {
    this.currentPage = 0;
    this.loadData();
  }

  getRoundedRating(value: number): number {
    return Math.floor(value || 0);
  }

  onStarClick(dishId: number, rating: number) {
    this.dishRated.emit({ menuID: this.menuID, dishId, rating });
  }

  ParseSortAndLoadData() {
    if (this.inputSortBy) {
      const input = this.inputSortBy.split('.');
      this.sortByField = input[0]
      this.sortByDirection = input[1];
    } else {
      this.sortByField = undefined;
      this.sortByDirection = undefined;
    }
    this.loadData();
  }
}
