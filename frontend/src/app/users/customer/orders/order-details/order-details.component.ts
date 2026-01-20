import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css'], 
})
export class OrderDetailsComponent implements OnInit {

  orderId!: number;
  items: any[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
  const idParam = this.route.snapshot.paramMap.get('orderId');

  if (!idParam) {
    this.error = 'Invalid order id';
    this.loading = false;
    return;
  }

  this.orderId = Number(idParam);

  this.http.get<any[]>(
    `http://localhost:3000/customer/orders/${this.orderId}`
  ).subscribe({
    next: data => {
      this.items = data;
      this.loading = false;
    },
    error: err => {
      this.error = 'Failed to load order details';
      this.loading = false;
      console.error(err);
    }
  });



  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  }
}
