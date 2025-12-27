import { Component } from '@angular/core';
import { UserComponent } from '../user/user.component';
import { User } from '../../../model/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {
  userList: User[] = [{
    email: "test@test.com",
    firstName: "fn1",
    lastName: "ln1"},
  {
    email: "test2@test2.com",
    firstName: "fn21",
    lastName: "ln21"
  }];

}
