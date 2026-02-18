import { Component, OnInit } from '@angular/core';
import { LoginLog } from '../../../model/LoginLog';
import { AdminService } from '../../../services/admin.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from "../../../shared/pagination/pagination.component";
import { BasePaginatedTable } from '../../../shared/pagination/base-paginated-table';

@Component({
  selector: 'app-login-log',
  standalone: true,
  imports: [DatePipe, FormsModule, PaginationComponent],
  templateUrl: './login-log.component.html',
  styleUrl: './login-log.component.css'
})
export class LoginLogComponent extends BasePaginatedTable<LoginLog> implements OnInit{

  constructor(private adminService: AdminService) { 
    super();
  }

  // search filters
  searchEmail: string = '';
  searchStatus: string = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const offset = this.currentPage * this.limit;

    this.adminService.getLoginLogs(this.searchEmail, this.searchStatus, this.limit, offset).subscribe({ // email and status can be passed through undefined
      next: (resp: any) => {
        this.data = resp.data;
        this.totalEntries = resp.metadata.totalEntries;
        console.log(resp);
      },
      error: (err) => {
        console.error('Error fetching login-logs: ', err);
      }
    });
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadData();
  }

  clearFilters() {
    this.searchEmail = '';
    this.searchStatus = '';
    this.applyFilters();
  }
}
