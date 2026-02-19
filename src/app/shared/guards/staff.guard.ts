import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const staffGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;

  const token = localStorage.getItem('medicloud_token');
  const role = (localStorage.getItem('medicloud_role') || '').toUpperCase();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (role !== 'TRABAJADOR' && role !== 'ADMIN') {
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};
