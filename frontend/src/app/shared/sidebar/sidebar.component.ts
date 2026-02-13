import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  @Input() title: string = '';
  @Input() menuItems: { label: string; route: string }[] = [];
  @Input() showLogout: boolean = false;

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
