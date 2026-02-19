import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, RegisterPayload, EmpresaPublica } from '../../../shared/api/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  correo = '';
  nombre = '';

  // ✅ en vez de "empresa" libre:
  id_empresa: number | null = null;
  empresas: EmpresaPublica[] = [];

  password = '';
  password2 = '';

  loading = false;
  loadingEmpresas = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  private loadEmpresas(): void {
    this.loadingEmpresas = true;
    this.error = '';

    this.api
      .getEmpresasPublicas()
      .pipe(finalize(() => (this.loadingEmpresas = false)))
      .subscribe({
        next: (rows) => {
          this.empresas = rows ?? [];
          // si solo hay 1, la preseleccionamos
          if (this.empresas.length === 1) {
            this.id_empresa = this.empresas[0].id_empresa;
          }
        },
        error: (e: any) => {
          this.empresas = [];
          this.error =
            e?.error?.error ||
            `No se pudieron cargar las empresas (HTTP ${e?.status || '?'})`;
        },
      });
  }

  private passOk(pw: string): boolean {
    // 8+ chars, 1 mayus, 1 numero, 1 especial
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
  }

  submit(): void {
    this.error = '';

    const correo = this.correo.trim().toLowerCase();
    const nombre = this.nombre.trim();
    const id_empresa = this.id_empresa;
    const p1 = this.password;
    const p2 = this.password2;

    if (!correo || !nombre || !id_empresa || !p1 || !p2) {
      this.error = 'Rellena correo, nombre, empresa y contraseña.';
      return;
    }

    if (p1 !== p2) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.passOk(p1)) {
      this.error = 'La contraseña debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 especial.';
      return;
    }

    // ✅ payload con id_empresa (no empresa)
    const payload: RegisterPayload = {
      correo,
      nombre,
      id_empresa,
      password: p1,
    };

    this.loading = true;

    this.api
      .register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          localStorage.setItem('medicloud_token', resp.token);
          localStorage.setItem('medicloud_role', resp.user.role);
          this.router.navigate(['/cliente/archivos']);
        },
        error: (e: any) => {
          this.error = e?.error?.error || `No se pudo registrar (HTTP ${e?.status || '?'})`;
        },
      });
  }
}
