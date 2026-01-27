import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginLogComponent } from './login-log.component';

describe('LoginLogComponent', () => {
  let component: LoginLogComponent;
  let fixture: ComponentFixture<LoginLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
