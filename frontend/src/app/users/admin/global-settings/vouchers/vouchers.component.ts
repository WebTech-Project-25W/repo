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
  newVoucher = { code: '', discount: 0, isActive: true };

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

  deleteVoucher(voucher: Voucher) {
    if (confirm("Are you sure you want to delete this voucher")) {
      console.log("deleteing");
      this.adminService.deleteVoucher(voucher.id)
        .subscribe({
          next: (resp: any) => {
            console.log("voucher deleted succusfully");
            const updatedVouchers = this.vouchers.filter(v => v.id !== Number(resp.deletedId))
            this.vouchers = [...updatedVouchers];
            this.totalEntries--;

            // handling deleting the last voucher on a page
            if (this.vouchers.length === 0 && this.currentPage > 0) {
              this.previousPage();
            }
          },
          error: (err: any) => {

          }
        })
    }
  }

  restrictRange(event: any, obj?: any, key?: string): void {
    let value = event.target.value;

    if (value === '') {
      if (obj && key) obj[key] = 0;
      return;
    }

    value = Math.max(0, Math.min(Number(value), 100));

    if (obj && key) {
      // Used for 'newVoucher' or 'voucher' in table
      obj[key] = value;
    } else {
      // Fallback for search filters (field is passed via 'key' if no obj)
      if (key === 'min') this.searchDiscountMin = value;
      if (key === 'max') this.searchDiscountMax = value;
    }

    event.target.value = value;
  }

  savePreviousDiscountValue(value?: number) {
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
    this.previousDiscountValue = field === 'min' ? this.searchDiscountMin : this.searchDiscountMax;
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
    this.searchIsActive = undefined;
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
    const { code, discount, isActive } = this.newVoucher;

    this.adminService.addVoucher(code, discount, isActive)
      .subscribe({
        next: (resp: any) => {
          alert(resp.message);
          this.loadVouchers();
          this.closeOverlay()
        },
        error: (err: any) => {
          alert(err.error.message);
          console.error('Error saving voucher: ', err);
          this.closeOverlay()
        }
      })

  }

  closeOverlay() {
    this.newVoucher = { code: '', discount: 0, isActive: true };
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
