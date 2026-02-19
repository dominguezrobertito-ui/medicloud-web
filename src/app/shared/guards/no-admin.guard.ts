import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const noAdminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;

  const token = localStorage.getItem('medicloud_token');
  const role = (localStorage.getItem('medicloud_role') || '').toUpperCase();

  // público -> OK
  if (!token) return true;

  // logueado como ADMIN -> fuera
  if (role === 'ADMIN') {
    router.navigate(['/']);
    return false;
  }

  return true;
};
