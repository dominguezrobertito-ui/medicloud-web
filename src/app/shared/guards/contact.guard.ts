import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const contactGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;

  const token = localStorage.getItem('medicloud_token');
  const role = (localStorage.getItem('medicloud_role') || '').toUpperCase();

  // Si NO hay sesión, contacto público permitido
  if (!token) return true;

  // Si hay sesión y es ADMIN (MediCloud), NO permitido
  if (role === 'ADMIN') {
    router.navigate(['/tickets']); // o /admin/management si prefieres
    return false;
  }

  return true;
};
