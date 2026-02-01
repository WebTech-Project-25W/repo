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

  // for adding a new voucher
  showAddOverlay: boolean = false;
  newVoucher = { code: '', discount: 0, is_active: true };

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
    voucher.isSaving = true;
    this.adminService.putVoucher(voucher.id, code, discount, isActive)
      .subscribe({
        next: (resp: any) => {
          Object.assign(voucher, resp.voucher);
          voucher.isBeingEdited = false;
          voucher.isSaving = false;
        },
        error: (err: any) => {
          voucher.isBeingEdited = false;
          voucher.isSaving = false;
          alert(err.error.message);
          console.error('Error saving voucher: ', voucher.id);
        }
      })
  }

  restrictSearchRange(event: any, field: 'min' | 'max'): void {
    let value = event.target.value;

    if (value === '') {
      if (field === 'min') this.searchDiscountMin = undefined;
      if (field === 'max') this.searchDiscountMax = undefined;
      return;
    }

    value = Number(value);
    value = Math.max(0, Math.min(value, 100));

    if (field === 'min') {
      this.searchDiscountMin = value;
    } else {
      this.searchDiscountMax = value;
    }

    event.target.value = value;
  }

  savePreviousDiscountValue(value?: number) {
    console.log(value);
    this.previousDiscountValue = value;
  }

  checkAndApplyFilters(field: 'min' | 'max'): void {
    if (this.searchDiscountMax && this.searchDiscountMin && this.searchDiscountMax < this.searchDiscountMin) {
      if (field === 'min') {
        this.searchDiscountMin = this.previousDiscountValue;
        alert("Min discount can not be greater than max discount.");
      } else {
        this.searchDiscountMax = this.previousDiscountValue;
        alert("Max discount can not be smaller than min discount.");
      }
      return;
    }
    // save value of field 
    this.previousDiscountValue = field === 'min'? this.searchDiscountMin: this.searchDiscountMax ;
    this.applyFilters();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadVouchers();
  }

  clearFilters(): void {
    this.searchId = undefined;
    this.searchCode = '';
    this.searchDiscountMax = undefined;
    this.searchDiscountMin = undefined;
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

  openAddVoucherOverlay() {
    this.showAddOverlay = true;
  }

  submitNewVoucher() {
    console.log(this.newVoucher);
  }

  closeOverlay() {
    this.newVoucher = { code: '', discount: 0, is_active: true };
    this.showAddOverlay = false;
  }

  onDiscountChange(event: any) {
    const value = this.newVoucher.discount;
    const boundedValue = Math.max(0, Math.min(value, 100));

    this.newVoucher.discount = boundedValue;

    if (event.target.value !== boundedValue.toString()) {
      event.target.value = boundedValue;
    }
  }
}
