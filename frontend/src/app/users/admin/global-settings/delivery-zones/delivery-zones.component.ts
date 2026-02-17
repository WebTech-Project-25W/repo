import { Component, ElementRef, ViewChild } from '@angular/core';
import { DeliveryZone } from '../../../../model/deliveryZone';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { SpinnerComponent } from "../../../../shared/spinner/spinner.component";

@Component({
  selector: 'app-delivery-zones',
  standalone: true,
  imports: [FormsModule, SidebarComponent, SpinnerComponent],
  templateUrl: './delivery-zones.component.html',
  styleUrl: './delivery-zones.component.css'
})
export class DeliveryZonesComponent {
  deliveryZones: DeliveryZone[] = [];

  showAddOverlay: boolean = false;
  newDeliveryZone = { id: '', isActive: true };

  // Pagination config
  limit: number = 5;
  currentPage: number = 0;
  totalEntries: number = 0;

  // Search filters
  searchId?: number;
  searchIsActive?: boolean;

  @ViewChild('zoneInput') zoneInput!: ElementRef<HTMLInputElement>;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadDeliveryZones();
  }

  get startIndex(): number {
    return this.currentPage * this.limit;
  }

  get endIndex(): number {
    const end = (this.currentPage * this.limit) + this.deliveryZones.length;
    return end > this.totalEntries ? this.totalEntries : end;
  }

  loadDeliveryZones(): void {
    const offset = this.currentPage * this.limit;

    this.adminService.getDeliveryZones(
      this.searchId,
      this.searchIsActive,
      this.limit,
      offset
    ).subscribe({
      next: (resp: any) => {
        this.deliveryZones = resp.data;
        this.totalEntries = parseInt(resp.metadata.totalEntries);
      },
      error: (err: any) => {
        console.error('Error fetching delivery zones:', err);
      }
    });
  }

  onIsActiveChange(event: any, deliveryZone: DeliveryZone) {
    const oldValue = deliveryZone.isActive;
    const newValue = event.target.value;
    deliveryZone.isUpdating = true;

    this.adminService.updateDeliveryZone(deliveryZone.id, newValue)
      .subscribe({
        next: (response: any) => {
          deliveryZone.isActive = response.deliveryZone.isActive;
          deliveryZone.isUpdating = false;
        },
        error: (err) => {
          event.target.value = oldValue;
          deliveryZone.isUpdating = false;
          alert('failed to update status of delivery zone: ' + deliveryZone.id);
        }
      })
  }

  saveDeliveryZone(deliveryzone: DeliveryZone, isActive: boolean) {
    deliveryzone.isUpdating = true;
    this.adminService.updateDeliveryZone(deliveryzone.id, isActive)
      .subscribe({
        next: (resp: any) => {
          Object.assign(deliveryzone, resp.deliveryzone);
          deliveryzone.isUpdating = false;
        },
        error: (err: any) => {
          deliveryzone.isUpdating = false;
          alert(err.error.message);
          console.error('Error saving delivery zone: ', deliveryzone.id);
        }
      })
  }

  deleteDeliveryZone(deliveryzone: DeliveryZone) {
    if (confirm("Are you sure you want to delete this delivery zone")) {
      console.log("deleting delivery zone '" + deliveryzone.id + "'...");
      this.adminService.deleteDeliveryZone(deliveryzone.id)
        .subscribe({
          next: (resp: any) => {
            console.log(`delivery zone '${resp.deletedId}' deleted successfully`);
            const updatedDeliveryZones = this.deliveryZones.filter(v => v.id !== resp.deletedId)
            this.deliveryZones = [...updatedDeliveryZones];
            this.totalEntries--;

            // handling deleting the last deliveryzone on a page
            if (this.deliveryZones.length === 0 && this.currentPage > 0) {
              this.previousPage();
            }
          },
          error: (err: any) => {
            console.log("Error deleting delivery zone: "+ err.message)
          }
        })
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadDeliveryZones();
  }

  clearFilters(): void {
    this.searchId = undefined;
    this.searchIsActive = undefined;
    this.applyFilters();
  }

  onLimitChange(): void {
    this.currentPage = 0;
    this.loadDeliveryZones();
  }

  nextPage(): void {
    if (this.endIndex < this.totalEntries) {
      this.currentPage++;
      this.loadDeliveryZones();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadDeliveryZones();
    }
  }

  openAddDeliveryZoneOverlay() {
    this.showAddOverlay = true;

    setTimeout(() => {
      if (this.zoneInput) {
        this.zoneInput.nativeElement.focus()
      }
    }, 0);
  }

  submitNewDeliveryZone() {
    const { id, isActive } = this.newDeliveryZone;

    this.adminService.addDeliveryZone(id, isActive)
      .subscribe({
        next: (resp: any) => {
          alert(resp.message);
          this.loadDeliveryZones();
          this.closeOverlay()
        },
        error: (err: any) => {
          alert(err.error.message);
          console.error('Error saving delivery zone: ', err);
          this.closeOverlay()
        }
      })

  }

  closeOverlay() {
    this.newDeliveryZone = { id: '', isActive: true };
    this.showAddOverlay = false;
  }
}
