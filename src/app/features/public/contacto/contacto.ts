import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../shared/api/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  correo = '';
  mensaje = '';

  loading = false;
  error = '';
  okMsg = '';

  constructor(private api: ApiService) {}

  private isValidEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  send(): void {
    const correo = this.correo.trim();
    const mensaje = this.mensaje.trim();

    this.error = '';
    this.okMsg = '';

    if (!correo) {
      this.error = 'Introduce tu correo.';
      return;
    }
    if (!this.isValidEmail(correo)) {
      this.error = 'El correo no parece válido.';
      return;
    }
    if (mensaje.length < 10) {
      this.error = 'Escribe un mensaje un poco más largo.';
      return;
    }

    this.loading = true;

    this.api
      .sendContact({ correo, mensaje })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.okMsg = '¡Enviado! Te responderemos por correo lo antes posible.';
          this.correo = '';
          this.mensaje = '';
        },
        error: (e: any) => {
          this.error =
            e?.error?.error ||
            `No se pudo enviar el mensaje (HTTP ${e?.status || '?'})`;
        },
      });
  }
}
