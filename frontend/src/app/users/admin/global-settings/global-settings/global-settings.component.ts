import { Component } from '@angular/core';
import { VouchersComponent } from '../vouchers/vouchers.component';
import { DeliveryZonesComponent } from '../delivery-zones/delivery-zones.component';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [VouchersComponent,DeliveryZonesComponent],
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.css'
})
export class GlobalSettingsComponent {

}
