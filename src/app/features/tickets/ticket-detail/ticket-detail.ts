import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, Ticket, TicketMensaje } from '../../../shared/api/api.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private sub?: Subscription;

  loading = false;
  sending = false;
  error = '';

  ticketId = 0;
  ticket: Ticket | null = null;
  mensajes: TicketMensaje[] = [];

  message = '';

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

  private role(): string {
    if (!isPlatformBrowser(this.platformId)) return 'CLIENTE';
    return localStorage.getItem('medicloud_role') || 'CLIENTE';
  }

  isStaff(): boolean {
    const r = this.role();
    return r === 'TRABAJADOR' || r === 'ADMIN';
  }

  ngOnInit(): void {
    // paramMap (no snapshot) => recarga bien al navegar
    this.sub = this.route.paramMap.subscribe((pm) => {
      const id = Number(pm.get('id'));
      if (!id) {
        this.error = 'Ticket inválido.';
        this.ticketId = 0;
        this.ticket = null;
        this.mensajes = [];
        this.cdr.detectChanges();
        return;
      }
      this.ticketId = id;
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      this.ticket = null;
      this.mensajes = [];
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.api
      .ticketDetail(token, this.ticketId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.ticket = data.ticket;
          this.mensajes = data.mensajes || [];
          this.cdr.detectChanges();
        },
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            e?.error?.detail ||
            `No se pudo cargar el ticket (HTTP ${e?.status || '?'})`;
          this.ticket = null;
          this.mensajes = [];
          this.cdr.detectChanges();
        },
      });
  }

  badgeClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'ABIERTO':
      case 'EN_PROCESO':
      case 'PENDIENTE':
        return 'badge badge-warn';
      case 'RESUELTO':
        return 'badge badge-ok';
      case 'CERRADO':
        return 'badge badge-muted';
      default:
        return 'badge';
    }
  }

  sendMessage(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión.';
      this.cdr.detectChanges();
      return;
    }

    const cuerpo = this.message.trim();
    if (!cuerpo) return;

    this.sending = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .addTicketMessage(token, this.ticketId, cuerpo)
      .pipe(
        finalize(() => {
          this.sending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.message = '';
          this.cdr.detectChanges();
          this.load();
        },
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            e?.error?.detail ||
            `No se pudo enviar el mensaje (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  assignToMe(): void {
    const token = this.token();
    if (!token || !this.isStaff()) return;

    this.sending = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .updateTicket(token, this.ticketId, { asignar_a_mi: true })
      .pipe(
        finalize(() => {
          this.sending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.load(),
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            e?.error?.detail ||
            `No se pudo asignar el ticket (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  // ✅ Prioridad SOLO la cambia el staff (cliente no)
  setPrioridad(prioridad: 'BAJA' | 'MEDIA' | 'ALTA'): void {
    const token = this.token();
    if (!token) return;

    if (!this.isStaff()) {
      this.error = 'No tienes permisos para cambiar la prioridad.';
      this.cdr.detectChanges();
      return;
    }

    this.sending = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .updateTicket(token, this.ticketId, { prioridad })
      .pipe(
        finalize(() => {
          this.sending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.load(),
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            e?.error?.detail ||
            `No se pudo actualizar la prioridad (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  setEstado(estado: string): void {
    const token = this.token();
    if (!token) return;

    this.sending = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .updateTicket(token, this.ticketId, { estado })
      .pipe(
        finalize(() => {
          this.sending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.load(),
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            e?.error?.detail ||
            `No se pudo actualizar el estado (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  back(): void {
    this.router.navigate(['/tickets']);
  }
}
