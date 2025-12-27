import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { OwnerGuard } from './owner.guard';

describe('ownerGuard', () => {
  const executeGuard: CanActivateFn = () => 
      TestBed.runInInjectionContext(() => OwnerGuard());

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
