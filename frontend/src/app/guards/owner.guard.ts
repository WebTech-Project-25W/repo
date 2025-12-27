import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const OwnerGuard = () => {
  const router = inject(Router);

  const role = localStorage.getItem('role');

  if (role === 'RestaurantOwner') {
    return true;
  }

 
  return router.createUrlTree(['/auth/login']);
};
