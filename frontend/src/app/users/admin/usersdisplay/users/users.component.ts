import { Component } from '@angular/core';
import { CustomersComponent } from "../customers/customers.component";
import { AdminsComponent } from "../admins/admins.component";
import { OwnersComponent } from "../owners/owners.component";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CustomersComponent, AdminsComponent, OwnersComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {

}
