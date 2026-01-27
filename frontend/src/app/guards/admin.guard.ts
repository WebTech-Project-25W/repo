import { Router } from '@angular/router';
import { inject  } from '@angular/core';

export const AdminGuard = () => {
  const router= inject(Router);
  const role = localStorage.getItem('role');

  if (role && role === 'SiteManager') {
    return true
  }

  router.navigate(['auth/login']);
  return false;
};
