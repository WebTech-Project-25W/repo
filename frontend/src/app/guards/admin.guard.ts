import { Router } from '@angular/router';
import { inject  } from '@angular/core';

export const AdminGuard = () => {
  const router= inject(Router);
  const token = localStorage.getItem('role');

  if (token && token === 'SiteManager') {
    return true
  }

  router.navigate(['/login']);
  return false;
};
