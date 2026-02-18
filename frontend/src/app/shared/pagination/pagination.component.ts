import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() limit = 10;
  @Input() currentPage = 0;
  @Input() totalEntries = 0;

  @Output() limitChange = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  get startIndex() { return this.currentPage * this.limit; }
  get endIndex() { return Math.min(this.startIndex + this.limit, this.totalEntries); }
}
