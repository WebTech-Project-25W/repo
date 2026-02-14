import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryZonesComponent } from './delivery-zones.component';

describe('DeliveryZonesComponent', () => {
  let component: DeliveryZonesComponent;
  let fixture: ComponentFixture<DeliveryZonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryZonesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeliveryZonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
