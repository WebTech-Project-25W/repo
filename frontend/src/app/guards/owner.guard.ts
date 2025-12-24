import { Router } from '@angular/router';
import { inject  } from '@angular/core';

export const OwnerGuard = () => {
  const router= inject(Router);
  const token = localStorage.getItem('role');

  if (token && token === 'RestaurantOwner') {
    return true
  }

  router.navigate(['auth/login']);
  return false;
};
