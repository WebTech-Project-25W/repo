import { Component, input } from '@angular/core';
import { LoginLog } from '../../../model/LoginLog';
import { Input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-login-log',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './login-log.component.html',
  styleUrl: './login-log.component.css'
})
export class LoginLogComponent {
  @Input() log!: LoginLog;





}
