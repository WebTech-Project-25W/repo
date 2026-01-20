import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { CustomerGuard } from './customer.guard';

describe('customerGuard', () => {
  const executeGuard: CanActivateFn = () => 
      TestBed.runInInjectionContext(() => CustomerGuard());

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
