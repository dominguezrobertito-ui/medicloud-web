import { Routes } from '@angular/router';

import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';
import { noAdminGuard } from './shared/guards/no-admin.guard';
import { adminGuard } from './shared/guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/public/home/home').then(m => m.Home) },

  { path: 'login', loadComponent: () => import('./features/public/login/login').then(m => m.Login) },

  // Contacto: público + pacientes + hospital staff, PERO no MediCloud (ADMIN)
  { path: 'contacto',
    canActivate: [noAdminGuard],
    loadComponent: () => import('./features/public/contacto/contacto').then(m => m.Contacto)
  },

  // Registro solo para pacientes (público)
  { path: 'register', loadComponent: () => import('./features/public/register/register').then(m => m.Register) },

  // ====== Portales ======
  {
    path: 'cliente/archivos',
    canActivate: [authGuard, roleGuard(['CLIENTE'])],
    loadComponent: () => import('./features/cliente/cliente-archivos/cliente-archivos').then(m => m.ClienteArchivos)
  },

  {
    path: 'trabajador/pacientes/archivos',
    canActivate: [authGuard, roleGuard(['TRABAJADOR'])],
    loadComponent: () => import('./features/trabajador/trabajador-pacientes-archivos/trabajador-pacientes-archivos')
      .then(m => m.TrabajadorPacientesArchivos)
  },

  // ====== Ticketing (solo TRABAJADOR hospital + ADMIN medicloud) ======
  {
    path: 'tickets',
    canActivate: [authGuard, roleGuard(['TRABAJADOR', 'ADMIN'])],
    loadComponent: () => import('./features/tickets/tickets-list/tickets-list').then(m => m.TicketsList)
  },
  {
    path: 'tickets/nuevo',
    canActivate: [authGuard, roleGuard(['TRABAJADOR', 'ADMIN'])],
    loadComponent: () => import('./features/tickets/ticket-new/ticket-new').then(m => m.TicketNew)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard, roleGuard(['TRABAJADOR', 'ADMIN'])],
    loadComponent: () => import('./features/tickets/ticket-detail/ticket-detail').then(m => m.TicketDetail)
  },

  // ====== Management MediCloud (ADMIN) ======
  {
    path: 'admin/empresas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-empresas/admin-empresas').then(m => m.AdminEmpresas),
  },
  {
    path: 'admin/empresas/:id/trabajadores',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-empresa-trabajadores/admin-empresa-trabajadores')
        .then(m => m.AdminEmpresaTrabajadores),
  },

  { path: 'forbidden', loadComponent: () => import('./shared/forbidden/forbidden').then(m => m.Forbidden) },
  { path: '**', loadComponent: () => import('./shared/not-found/not-found').then(m => m.NotFound) },
];
