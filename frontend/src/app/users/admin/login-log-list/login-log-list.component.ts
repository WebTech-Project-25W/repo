import { Component } from '@angular/core';
import { LoginLog } from '../../../model/LoginLog';
import { AdminService } from '../../../services/admin.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-log-list',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './login-log-list.component.html',
  styleUrl: './login-log-list.component.css'
})
export class LoginLogListComponent {
  logs: LoginLog[] = [];

  constructor(
    private adminService: AdminService,
  ) { }

  // for pagination
  limit: number = 7;
  currentPage: number = 0;

  // search filters
  searchEmail: string = '';
  searchStatus: string = '';


  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    const offset = this.currentPage * this.limit;

    this.adminService.getLoginLogs(this.searchEmail, this.searchStatus, this.limit, offset).subscribe({ // email and status can be passed through undefined
      next: (data: LoginLog[]) => {
        this.logs = data;
      },
      error: (err) => {
        console.error('Error fetching login-logs: ', err);
      }
    });
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadLogs();
  }

  clearFilters() {
    this.searchEmail = '';
    this.searchStatus = '';
    this.applyFilters();
  }
  
  onLimitChange() {
    this.currentPage = 0;
    this.loadLogs();
  }

  nextPage() {
    this.currentPage++;
    this.loadLogs();
  }

  previousPage() {
    if (this.currentPage >0) {
      this.currentPage--;
      this.loadLogs();
    }
  }
}
