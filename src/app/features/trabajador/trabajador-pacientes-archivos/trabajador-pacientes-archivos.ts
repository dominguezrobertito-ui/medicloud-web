import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService, StaffArchivoRow } from '../../../shared/api/api.service';

@Component({
  selector: 'app-trabajador-pacientes-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trabajador-pacientes-archivos.html',
  styleUrl: './trabajador-pacientes-archivos.css',
})
export class TrabajadorPacientesArchivos implements OnInit {
  private platformId = inject(PLATFORM_ID);

  loading = false;
  error = '';

  q = '';
  rows: StaffArchivoRow[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('medicloud_token');
  }

  private role(): string {
    if (!isPlatformBrowser(this.platformId)) return 'CLIENTE';
    return localStorage.getItem('medicloud_role') || 'CLIENTE';
  }

  ngOnInit(): void {
    // seguridad UI: si no es staff, fuera
    if (!(this.role() === 'TRABAJADOR' || this.role() === 'ADMIN')) {
      this.router.navigate(['/forbidden']);
      return;
    }
    this.load();
  }

  load(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.staffFiles(token, this.q.trim())
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.rows = data ?? [];
          this.cdr.detectChanges();
        },
        error: (e: any) => {
          this.error = e?.error?.error || `Error cargando archivos (HTTP ${e?.status || '?'})`;
          this.rows = [];
          this.cdr.detectChanges();
        }
      });
  }

  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let n = bytes || 0;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  getTotalBytes(): number {
    return this.rows.reduce((total, r) => total + (r.tamano_bytes || 0), 0);
  }

  badgeClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'ACTIVO': return 'badge badge-ok';
      case 'CUARENTENA': return 'badge badge-warn';
      case 'ELIMINADO': return 'badge badge-muted';
      default: return 'badge';
    }
  }

  openFile(uri: string): void {
    // OJO: /storage es público en dev. Más adelante lo blindamos con un endpoint protegido.
    window.open(`http://localhost:3000${uri}`, '_blank');
  }
}
