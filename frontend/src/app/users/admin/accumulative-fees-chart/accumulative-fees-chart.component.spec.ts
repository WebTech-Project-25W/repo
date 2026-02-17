import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccumulativeFeesChartComponent } from './accumulative-fees-chart.component';

describe('AccumulativeFeesChartComponent', () => {
  let component: AccumulativeFeesChartComponent;
  let fixture: ComponentFixture<AccumulativeFeesChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccumulativeFeesChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AccumulativeFeesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
