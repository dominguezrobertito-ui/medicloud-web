import { Component, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router,} from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, TrabajadorEmpresa } from '../../../shared/api/api.service';

@Component({
  selector: 'app-admin-empresa-trabajadores',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './admin-empresa-trabajadores.html',
  styleUrl: './admin-empresa-trabajadores.css',
})
export class AdminEmpresaTrabajadores {
  private platformId = inject(PLATFORM_ID);
  private sub?: Subscription;

  idEmpresa = 0;
  nombreEmpresa = '';

  rows: TrabajadorEmpresa[] = [];
  loading = false;
  error = '';

  q = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('medicloud_token');
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((pm) => {
      const id = Number(pm.get('id'));
      this.idEmpresa = id || 0;
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión.';
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    if (!this.idEmpresa) {
      this.error = 'Empresa inválida.';
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    // Fetch empresa name first
    this.api.adminEmpresas(token)
      .subscribe({
        next: (empresas) => {
          const empresa = empresas?.find(e => e.id_empresa === this.idEmpresa);
          this.nombreEmpresa = empresa?.nombre || `Empresa #${this.idEmpresa}`;
          this.cdr.detectChanges();
        },
        error: () => {
          this.nombreEmpresa = `Empresa #${this.idEmpresa}`;
          this.cdr.detectChanges();
        }
      });

    this.api.adminEmpresaTrabajadores(token, this.idEmpresa)
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
          this.error = e?.error?.error || `Error cargando trabajadores (HTTP ${e?.status || '?'})`;
          this.rows = [];
          this.cdr.detectChanges();
        }
      });
  }

  get filtered(): TrabajadorEmpresa[] {
    const q = this.q.trim().toLowerCase();
    return (this.rows ?? []).filter((r) => {
      if (!q) return true;
      return (
        String(r.nombre || '').toLowerCase().includes(q) ||
        String(r.correo || '').toLowerCase().includes(q) ||
        String(r.estado || '').toLowerCase().includes(q)
      );
    });
  }

  badgeEstado(estado: string): string {
    const v = String(estado || '').toUpperCase();
    if (v === 'ACTIVA') return 'badge badge-ok';
    if (v === 'BLOQUEADA') return 'badge badge-warn';
    if (v === 'BAJA') return 'badge badge-muted';
    return 'badge';
  }

  back(): void {
    this.router.navigate(['/admin/empresas']);
  }
}
