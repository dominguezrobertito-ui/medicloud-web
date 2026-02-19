import { Component, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription, filter } from 'rxjs';

import { ApiService, Ticket } from '../../../shared/api/api.service';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tickets-list.html',
  styleUrl: './tickets-list.css',
})
export class TicketsList implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private navSub?: Subscription;

  tickets: Ticket[] = [];
  loading = false;
  error = '';

  search = '';
  onlyNotClosed = true; // filtro rápido “no cerrados”

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
    // ✅ 1) carga al entrar
    this.loadTickets(true);

    // ✅ 2) recarga automática SOLO cuando vuelves a /tickets exacto
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url.split('?')[0];
        if (url === '/tickets') {
          this.loadTickets(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  loadTickets(force = false): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      this.tickets = [];
      this.loading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/login']);
      return;
    }

    // ✅ si ya está cargando y NO es force, no dispares otra
    if (this.loading && !force) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .tickets(token)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rows) => {
          this.tickets = rows ?? [];
          this.cdr.detectChanges();
        },
        error: (e: any) => {
          // ✅ si es 401, limpia sesión y fuera
          if (e?.status === 401) {
            localStorage.removeItem('medicloud_token');
            localStorage.removeItem('medicloud_role');
            this.router.navigate(['/login']);
            return;
          }

          this.error =
            e?.error?.error ||
            e?.error?.sqlMessage ||
            `Error cargando tickets (HTTP ${e?.status || '?'})`;
          this.tickets = [];
          this.cdr.detectChanges();
        },
      });
  }

  get filteredTickets(): Ticket[] {
    const q = this.search.trim().toLowerCase();

    return (this.tickets ?? []).filter((t) => {
      const estado = String(t.estado || '').toUpperCase();

      if (this.onlyNotClosed && (estado === 'CERRADO' || estado === 'RESUELTO')) return false;

      if (!q) return true;

      const asunto = String(t.asunto || '').toLowerCase();
      // Ojo: aunque la prioridad exista en BD, no la mostramos al cliente, pero tu búsqueda no rompe por ello
      const estadoLower = estado.toLowerCase();
      const tipo = String(t.tipo_ticket || '').toLowerCase();

      return asunto.includes(q) || estadoLower.includes(q) || tipo.includes(q);
    });
  }

  badgeClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'ABIERTO':
      case 'PENDIENTE':
      case 'EN_PROCESO':
        return 'badge badge-warn';
      case 'RESUELTO':
        return 'badge badge-ok';
      case 'CERRADO':
        return 'badge badge-muted';
      default:
        return 'badge';
    }
  }

  openTicket(id: number | string): void {
    this.router.navigate(['/tickets', id]);
  }

  newTicket(): void {
    this.router.navigate(['/tickets/nuevo']);
  }

  toggleOnlyNotClosed(): void {
    this.onlyNotClosed = !this.onlyNotClosed;
  }

  logout(): void {
    localStorage.removeItem('medicloud_token');
    localStorage.removeItem('medicloud_role');
    this.router.navigate(['/login']);
  }
}
