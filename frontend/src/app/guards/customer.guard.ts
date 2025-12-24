import { Router } from '@angular/router';
import { inject  } from '@angular/core';

export const CustomerGuard = () => {
  const router= inject(Router);
  const token = localStorage.getItem('role');

  if (token && token === 'Customer') {
    return true
  }

  router.navigate(['auth/login']);
  return false;
};
