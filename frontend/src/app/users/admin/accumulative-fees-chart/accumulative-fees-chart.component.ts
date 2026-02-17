import { Component, ElementRef, ViewChild } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { finalize } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { SpinnerComponent } from "../../../shared/spinner/spinner.component"; 

Chart.register(...registerables);

@Component({
  selector: 'app-accumulative-fees-chart',
  standalone: true,
  imports: [SpinnerComponent],
  templateUrl: './accumulative-fees-chart.component.html',
  styleUrl: './accumulative-fees-chart.component.css'
})
export class AccumulativeFeesChartComponent {
  accumulativeFees: any = [];
  isLoadingAccumulativeFees: boolean = false;

  @ViewChild('accumulativeFeesCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  chart: any;

  constructor(
    private adminService: AdminService,
  ) { }

  ngOnInit(): void {
    // this.loadAccumulativeFees();
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.loadAccumulativeFees();
  }

  loadAccumulativeFees() {
    this.isLoadingAccumulativeFees = true;
    this.adminService.getAccumulativeFees()
      .pipe(
        finalize(() => {
          this.isLoadingAccumulativeFees = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.accumulativeFees = data;

          this.chart.data.labels = data.map((row: any) => row.order_date );
          //   const date = new Date(row.order_date);
          //   return date.toLocaleDateString('en-GB', {
          //     day: 'numeric',
          //     month: 'short'
          //   })
          // });

          this.chart.data.datasets[0].data = data.map((row: any) => row.sum);

          this.chart.update();
        },
        error: (err) => {
          console.error('Failed to load accumulative fees', err)
        }
      })
  }

  initChart(): void {
    const labels = this.accumulativeFees.map((row: { order_date: any; }) => row.order_date);
    const dataPoints = this.accumulativeFees.map((row: { sum: any; }) => row.sum);

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumulative Service Fee Revenue',
          data: dataPoints,
          borderColor: 'rgb(30, 120, 22)',
          backgroundColor: 'rgba(81, 245, 66, 0.1)',
          fill: true,
          tension: 0.4 // Makes the line curvy
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => `€${context.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => `€${value}`
            }
          },
          x: {
            type: 'time',
            time: {
              unit: 'day', // Forces the grid lines to represent days
              displayFormats: {
                day: 'd MMM'
              },
              tooltipFormat: 'PP'
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
        }
      }
    });
  }
}
