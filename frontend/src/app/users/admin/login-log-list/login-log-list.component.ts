import { Component } from '@angular/core';
import { LoginLogComponent } from "../login-log/login-log.component";
import { LoginLog } from '../../../model/LoginLog';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-login-log-list',
  standalone: true,
  imports: [LoginLogComponent],
  templateUrl: './login-log-list.component.html',
  styleUrl: './login-log-list.component.css'
})
export class LoginLogListComponent {
  logs: LoginLog[] = [];

  constructor(
    private adminService: AdminService,
  ) { }

  ngOnInit(): void {
    this.adminService.getLoginLogs().subscribe({
      next: (data: LoginLog[]) => {
        this.logs = data;
        console.log('login-logs loaded: ', this.logs, data);
      },
      error: (err) => {
        console.log('Error fetching login-logs: ', err);
      }
    });
  }

}
