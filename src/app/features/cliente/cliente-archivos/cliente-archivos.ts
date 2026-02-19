import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService, Archivo } from '../../../shared/api/api.service';

@Component({
  selector: 'app-cliente-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './cliente-archivos.html',
  styleUrl: './cliente-archivos.css',
})
export class ClienteArchivos implements OnInit {
  archivos: Archivo[] = [];
  error = '';
  loading = false;

  // Upload
  uploading = false;
  uploadOkMsg = '';

  // Delete
  deletingId: number | null = null;

  // UI
  search = '';
  hideDeleted = true;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  /* ======================
     Carga de archivos
     ====================== */
  loadFiles(): void {
    const token = localStorage.getItem('medicloud_token');

    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      this.archivos = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .files(token)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.archivos = data ?? [];
          this.cdr.detectChanges();
        },
        error: (e: any) => {
          if (e?.status === 401) {
            this.error = 'Sesión caducada o inválida. Vuelve a iniciar sesión.';
          } else if (e?.status === 0) {
            this.error =
              'No se puede conectar con la API. ¿Está levantada en http://localhost:3000?';
          } else {
            this.error = `Error cargando archivos (HTTP ${e?.status || '?'})`;
          }
          this.archivos = [];
          this.cdr.detectChanges();
        },
      });
  }

  /* ======================
     Subida de PDF
     ====================== */
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.error = 'Solo se permite subir archivos PDF.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    const token = localStorage.getItem('medicloud_token');
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.uploading = true;
    this.uploadOkMsg = '';
    this.error = '';
    this.cdr.detectChanges();

    this.api
      .uploadFile(token, file)
      .pipe(
        finalize(() => {
          this.uploading = false;
          input.value = ''; // permite subir el mismo fichero otra vez
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.uploadOkMsg = 'Archivo subido correctamente.';
          this.cdr.detectChanges();
          this.loadFiles();
        },
        error: (e: any) => {
          this.error = `Error subiendo archivo (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  /* ======================
     Eliminación (soft delete)
     ====================== */
  deleteArchivo(a: Archivo): void {
    const token = localStorage.getItem('medicloud_token');
    if (!token) {
      this.error = 'No hay sesión. Vuelve a iniciar sesión.';
      this.cdr.detectChanges();
      return;
    }

    const ok = confirm(`¿Seguro que quieres eliminar "${a.nombre_original}"?`);
    if (!ok) return;

    this.deletingId = a.id_archivo;
    this.error = '';
    this.uploadOkMsg = '';
    this.cdr.detectChanges();

    this.api
      .deleteFile(token, a.id_archivo)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.uploadOkMsg = 'Archivo eliminado.';
          this.cdr.detectChanges();
          this.loadFiles();
        },
        error: (e: any) => {
          this.error = `Error eliminando archivo (HTTP ${e?.status || '?'})`;
          this.cdr.detectChanges();
        },
      });
  }

  /* ======================
     UI helpers
     ====================== */

  get filteredArchivos(): Archivo[] {
    const q = this.search.trim().toLowerCase();

    return this.archivos.filter((a) => {
      const estado = (a.estado_archivo || '').toUpperCase();

      if (this.hideDeleted && estado === 'ELIMINADO') return false;

      if (!q) return true;

      const name = (a.nombre_original || '').toLowerCase();
      const est = (a.estado_archivo || '').toLowerCase();
      return name.includes(q) || est.includes(q);
    });
  }

  get visibleCount(): number {
    return this.filteredArchivos.length;
  }

  get visibleBytes(): number {
    return this.filteredArchivos.reduce((acc, a) => acc + (a.tamano_bytes || 0), 0);
  }

  get totalBytes(): number {
    return this.archivos.reduce((acc, a) => acc + (a.tamano_bytes || 0), 0);
  }

  toggleHideDeleted(): void {
    this.hideDeleted = !this.hideDeleted;
  }

  formatBytes(bytes: number): string {
    if (bytes === null || bytes === undefined) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n = n / 1024;
      i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  badgeClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'ACTIVO':
        return 'badge badge-ok';
      case 'CUARENTENA':
        return 'badge badge-warn';
      case 'ELIMINADO':
        return 'badge badge-muted';
      default:
        return 'badge';
    }
  }

  fileExt(name: string): string {
    if (!name) return '';
    const parts = name.split('.');
    if (parts.length < 2) return '';
    const ext = parts[parts.length - 1].toUpperCase();
    return ext.length <= 6 ? ext : '';
  }

  asDate(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ======================
     Actions
     ====================== */

  openFile(uri: string): void {
    window.open(`http://localhost:3000${uri}`, '_blank');
  }

  logout(): void {
    localStorage.removeItem('medicloud_token');
    localStorage.removeItem('medicloud_role');
    this.router.navigate(['/login']);
  }
}
