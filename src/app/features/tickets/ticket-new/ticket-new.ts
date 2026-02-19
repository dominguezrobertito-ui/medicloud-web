import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiService, TicketCreateResponse } from '../../../shared/api/api.service';



@Component({
  selector: 'app-ticket-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-new.html',
  styleUrls: ['./ticket-new.css'],
})
export class TicketNew {
  private platformId = inject(PLATFORM_ID);
  loading = false;
  error = '';

  asunto = '';
  descripcion = '';
  
  // Para staff/admin (si no, se ignora)
  cliente_email = '';

  role = this.getRole();

  constructor(private api: ApiService, private router: Router) {}

  private getRole(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('medicloud_role') || 'CLIENTE';
    }
    return 'CLIENTE';
  }

  private token(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('medicloud_token');
    }
    return null;
  }

  isStaff(): boolean {
    return this.role === 'TRABAJADOR' || this.role === 'ADMIN';
  }

  submit(): void {
    const token = this.token();
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      return;
    }

    this.error = '';
    const asunto = this.asunto.trim();
    const descripcion = this.descripcion.trim();

    if (!asunto) {
      this.error = 'El asunto es obligatorio.';
      return;
    }

    // Si es staff, obligamos email del cliente (para ticket EMPRESA_A_CLIENTE)
    if (this.isStaff() && !this.cliente_email.trim()) {
      this.error = 'Indica el email del cliente para crear un ticket hacia él.';
      return;
    }

    const payload: any = {
      asunto,
      descripcion: descripcion || undefined,
    };

    if (this.isStaff()) {
      payload.cliente_email = this.cliente_email.trim();
    }

    this.loading = true;
    this.api
      .createTicket(token, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r: TicketCreateResponse) => {
          const id = r?.id_ticket;
          if (id) this.router.navigate(['/tickets', id]);
          else this.router.navigate(['/tickets']);
        },
        error: (e: any) => {
          const msg =
            e?.error?.error ||
            e?.error?.detail ||
            'No se ha podido crear el ticket.';
          this.error = msg;
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/tickets']);
  }
}
