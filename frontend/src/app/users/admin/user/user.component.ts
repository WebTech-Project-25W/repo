import { Component } from '@angular/core';
import { User } from '../../../model/user';
import { Input } from '@angular/core';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  @Input() user!: User;

  email: string = '';
  firstName: string = '';
  lastName: string = '';

}
