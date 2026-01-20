import { Component, OnInit } from '@angular/core';
import { UserComponent } from '../user/user.component';
import { User } from '../../../model/user';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  userList: User[] = [];

  constructor(
    private adminService: AdminService,
  ) { }

  ngOnInit(): void {
    this.adminService.getUsers().subscribe({
      next: (data: User[]) => {
        this.userList = data;
        console.log('Users loaded: ', this.userList, data);
      },
      error: (err) => {
        console.log('Error fetching users: ', err);
      }
    }); 
  }
}
