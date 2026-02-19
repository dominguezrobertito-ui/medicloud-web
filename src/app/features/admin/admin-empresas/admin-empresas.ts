import { Component, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService, Empresa } from '../../../shared/api/api.service';

@Component({
  selector: 'app-admin-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './admin-empresas.html',
  styleUrl: './admin-empresas.css',
})
export class AdminEmpresas {
  private platformId = inject(PLATFORM_ID);

  rows: Empresa[] = [];
  loading = false;
  error = '';

  q = '';
  showInactive = true;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('medicloud_token');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión.';
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.adminEmpresas(token)
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
          this.error = e?.error?.error || `Error cargando empresas (HTTP ${e?.status || '?'})`;
          this.rows = [];
          this.cdr.detectChanges();
        }
      });
  }

  get filtered(): Empresa[] {
    const q = this.q.trim().toLowerCase();
    return (this.rows ?? []).filter((r) => {
      if (!this.showInactive && String(r.estado).toUpperCase() !== 'ACTIVA') return false;
      if (!q) return true;
      return String(r.nombre || '').toLowerCase().includes(q) || String(r.id_empresa).includes(q);
    });
  }

  badgeEstado(estado: string): string {
    const v = String(estado || '').toUpperCase();
    if (v === 'ACTIVA') return 'badge badge-ok';
    if (v === 'INACTIVA') return 'badge badge-muted';
    return 'badge';
  }

  openTrabajadores(idEmpresa: number): void {
    this.router.navigate(['/admin/empresas', idEmpresa, 'trabajadores']);
  }
}
