import { Router } from '@angular/router';
import { inject  } from '@angular/core';

export const CustomerGuard = () => {
  const router= inject(Router);
  const role = localStorage.getItem('role');

  if (role && role === 'Customer') {
    return true
  }

  router.navigate(['auth/login']);
  return false;
};
