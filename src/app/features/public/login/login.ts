import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../shared/api/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private platformId = inject(PLATFORM_ID);

  email = '';
  password = '';

  loading = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  submit(): void {
    this.error = '';

    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!email || !password) {
      this.error = 'Introduce correo y contraseña.';
      return;
    }

    this.loading = true;

    this.api
      .login(email, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          localStorage.setItem('medicloud_token', resp.token);
          localStorage.setItem('medicloud_role', resp.user.role);

          const role = (resp.user.role || 'CLIENTE').toUpperCase();

          if (role === 'CLIENTE') this.router.navigate(['/cliente/archivos']);
          else if (role === 'TRABAJADOR') this.router.navigate(['/trabajador/pacientes/archivos']);
          else this.router.navigate(['/admin/empresas']); // ADMIN medicloud
        },

        error: (e: any) => {
          // Sin conexión (API caída / CORS / URL mal)
          if (e?.status === 0) {
            this.error = 'No se puede conectar con la API. ¿Está levantada en http://localhost:3000?';
            return;
          }

          // Backend puede devolver bloqueo_hasta
          if (e?.status === 423) {
            const hasta = e?.error?.bloqueo_hasta ? ` (hasta ${e.error.bloqueo_hasta})` : '';
            this.error = `Cuenta bloqueada temporalmente por intentos fallidos${hasta}.`;
            return;
          }

          if (e?.status === 403) {
            this.error = e?.error?.error || 'Acceso denegado.';
            return;
          }

          if (e?.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
            return;
          }

          this.error = e?.error?.error || `Error en login (HTTP ${e?.status || '?'})`;
        },
      });
  }
}
