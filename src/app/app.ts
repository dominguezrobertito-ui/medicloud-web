import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  hasSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!localStorage.getItem('medicloud_token');
  }

  role(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return (localStorage.getItem('medicloud_role') || '').toUpperCase();
  }

  isAdmin(): boolean {
    return this.role() === 'ADMIN';
  }

  // Links visibles en nav según reunión
  showContactoNav(): boolean {
    const r = this.role();
    return r === 'PUBLIC' || r === 'CLIENTE' || r === 'TRABAJADOR';
  }

  showTicketsNav(): boolean {
    const r = this.role();
    return r === 'TRABAJADOR' || r === 'ADMIN';
  }

  showPacienteArchivosNav(): boolean {
    return this.role() === 'CLIENTE';
  }

  showHospitalPanelNav(): boolean {
    return this.role() === 'TRABAJADOR';
  }

  showAdminNav(): boolean {
    return this.role() === 'ADMIN';
  }

  // Donde manda el logo (más "pro" que llevar a home marketing)
  goHome(): void {
    const r = this.role();
    if (!this.hasSession()) {
      this.router.navigate(['/']);
      return;
    }
    if (r === 'CLIENTE') this.router.navigate(['/cliente/archivos']);
    else if (r === 'TRABAJADOR') this.router.navigate(['/trabajador/pacientes/archivos']);
    else this.router.navigate(['/admin/empresas']); // ADMIN
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('medicloud_token');
    localStorage.removeItem('medicloud_role');
    this.router.navigate(['/login']);
  }
}
