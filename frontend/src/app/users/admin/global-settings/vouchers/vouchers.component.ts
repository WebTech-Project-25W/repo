import { Component } from '@angular/core';
import { Voucher } from '../../../../model/voucher';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vouchers.component.html',
  styleUrl: './vouchers.component.css'
})
export class VouchersComponent {
  vouchers: Voucher[] = [];

  // Pagination config
  limit: number = 5;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchId?: number;
  searchCode: string = '';
  // searchLastName: string = '';
  //search range

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadVouchers();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.vouchers.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadVouchers(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getVouchers(
      {
        id: this.searchId,
        code: this.searchCode
      },
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.vouchers = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching vouchers:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadVouchers();
  }

  clearFilters(): void {
    this.searchId = undefined;
    this.searchCode = '';
    this.applyFilters();
  }

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadVouchers();
  }

  nextPage(): void {
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadVouchers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadVouchers();
    }
  }
}
