import { Component } from '@angular/core';
import { LoginLog } from '../../../model/LoginLog';
import { AdminService } from '../../../services/admin.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-log',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './login-log.component.html',
  styleUrl: './login-log.component.css'
})
export class LoginLogComponent {
  logs: LoginLog[] = [];

  constructor(
    private adminService: AdminService,
  ) { }

  // for pagination
  limit: number = 5;
  currentPage: number = 0;

  // search filters
  searchEmail: string = '';
  searchStatus: string = '';

  totalEntries: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    const offset = this.currentPage * this.limit;

    this.adminService.getLoginLogs(this.searchEmail, this.searchStatus, this.limit, offset).subscribe({ // email and status can be passed through undefined
      next: (resp: any) => {
        this.logs = resp.data;
        this.totalEntries = resp.metadata.totalEntries;
        this.startIndex = resp.metadata.offset;
        this.endIndex = resp.metadata.offset + this.logs.length;
        console.log(resp);
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
