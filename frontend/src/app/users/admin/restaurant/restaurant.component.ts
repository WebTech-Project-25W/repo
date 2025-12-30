import { Component, Input } from '@angular/core';
import { Restaurant } from '../../../model/restaurant';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [],
  templateUrl: './restaurant.component.html',
  styleUrl: './restaurant.component.css'
})
export class RestaurantComponent {
  @Input() restaurant!: Restaurant;

  constructor(
    private adminService: AdminService,
  ) { }

  updateApprovalStatus(newStatus: string) {
    this.adminService.updateApprovalStatus(this.restaurant.id, newStatus).subscribe({
      next: (response: any) => {

        console.log(
          `Approval status of restaurant ${this.restaurant.id} succesfully update to ${newStatus}`,
          response)
      },
      error: (err: any) => console.error("Error updating status:", err)
    })
  }
}
