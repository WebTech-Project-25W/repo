import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  stats = [
    { label: 'Restaurants', value: 0, target: 50 },
    { label: 'Menus', value: 0, target: 120 },
    { label: 'Dishes', value: 0, target: 450 },
  ];

  ngOnInit(): void {
    this.animateStats();
  }

  animateStats() {
    this.stats.forEach((stat) => {
      const interval = setInterval(() => {
        if (stat.value < stat.target) {
          stat.value += Math.ceil(stat.target / 40);
        } else {
          stat.value = stat.target;
          clearInterval(interval);
        }
      }, 30);
    });
  }
}
