import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {

  orders: any[] = [];
  loading = true;
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:3000/customer/orders')
      .subscribe({
        next: data => {
          this.orders = data;
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.error = 'Failed to load orders';
          this.loading = false;
        }
      });
  }
  goToOrder(orderId: number) {
  this.router.navigate(['/customer/orders', orderId]);
}
}
