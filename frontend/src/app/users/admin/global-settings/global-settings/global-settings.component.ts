import { Component } from '@angular/core';
import { VouchersComponent } from '../vouchers/vouchers.component';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [VouchersComponent],
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.css'
})
export class GlobalSettingsComponent {

}
