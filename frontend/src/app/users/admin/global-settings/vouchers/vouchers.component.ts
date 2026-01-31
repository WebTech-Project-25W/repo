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
  searchDiscountMin?: number;
  searchDiscountMax?: number;
  searchIsActive?: boolean;
  //search range

  previousDiscountValue?: number;

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
        code: this.searchCode,
        discountMin: this.searchDiscountMin,
        discountMax: this.searchDiscountMax,
        isActive: this.searchIsActive
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

  editVoucher(voucher: Voucher) {
    voucher.isBeingEdited = true
  }

  cancelEdit(voucher: Voucher) {
    voucher.isBeingEdited = false;
  }

  saveVoucher(voucher: Voucher, code: string, discount: number, isActive: boolean) {
    // put to update voucher
    this.adminService.putVoucher(voucher.id, code, discount, isActive)
      .subscribe({
        next: (resp: any) => {
          Object.assign(voucher, resp.voucher);
          voucher.isBeingEdited = false;
      },
        error: (err: any) => {
          voucher.isBeingEdited = false;
          alert(err.error.message);
          console.error('Error saving voucher: ', voucher.id);
      }
    })
  }

  savePreviousDiscountValue(value?: number) {
    this.previousDiscountValue = value;
  }

  checkAndApplyFilters(minMax: string, value?: number): void {
    if (value == undefined) {
      this.clearFilters();
      return;
    }
    if (!value || isNaN(value) || value > 100 || value < 0) {
      console.error('invalid discount filter value');
      return;
    }

    if (minMax === 'min') {
      if (this.searchDiscountMax) {
        if (value > this.searchDiscountMax) {
          alert("Min cannot be greater than Max. Reverting...");
          this.searchDiscountMin = this.previousDiscountValue;
          return
        }
      }
    }
    else if (minMax === 'max') {
      if (this.searchDiscountMin) {
        if (value < this.searchDiscountMin) {
          alert("Max cannot be lesser than Min. Reverting...");
          this.searchDiscountMax = this.previousDiscountValue;
          return
        }
      }
    }
    this.applyFilters();
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
