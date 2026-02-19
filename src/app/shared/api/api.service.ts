import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; role: string };
}

export interface Archivo {
  id_archivo: number;
  id_cuenta_propietaria: number;
  id_cuenta_subidora: number;
  nombre_original: string;
  uri_almacenamiento: string;
  hash_sha256: string | null;
  estado_archivo: string;
  tamano_bytes: number;
  fecha_subida: string;
}

export type RegisterPayload = {
  correo: string;
  nombre: string;
  id_empresa: number;
  password: string;
};



/* ===== Tickets ===== */
export interface Ticket {
  id_ticket: number | string;
  id_cuenta_cliente?: number;
  id_cuenta_creador?: number;
  id_cuenta_asignado?: number | null;

  tipo_ticket: string;
  prioridad: string;
  estado: string;

  asunto: string;

  creado_en?: string;
  actualizado_en?: string;
  cerrado_en?: string | null;

  cliente_correo?: string;
  creador_correo?: string;
  asignado_correo?: string | null;

  mensajes?: number; // si lo devuelves en /tickets
}

export interface TicketMensaje {
  id_mensaje: number | string;
  id_ticket: number | string;
  id_cuenta_autor: number;
  cuerpo: string;
  enviado_en: string;

  autor_correo?: string;
  autor_tipo?: string;
}

export type TicketDetailResponse = {
  ticket: Ticket;
  mensajes: TicketMensaje[];
  adjuntos?: any[];
};

export type TicketCreateResponse = { ok: true; id_ticket: number };

export type TicketCreatePayload = {
  asunto: string;
  descripcion?: string;
  // prioridad NO la elige el creador => no la pongas en el form (pero la BD la mantiene)
  cliente_email?: string | null;
  id_cuenta_cliente?: number | null;
  id_cuenta_asignado?: number | null;
};

export type TicketUpdatePayload = {
  estado?: string | null;
  asignar_a_mi?: boolean;
  id_cuenta_asignado?: number | null;
  prioridad?: 'BAJA' | 'MEDIA' | 'ALTA' | null; // solo staff
};

export interface StaffArchivoRow {
  id_archivo: number;
  nombre_original: string;
  uri_almacenamiento: string;
  hash_sha256: string | null;
  estado_archivo: string;
  tamano_bytes: number;
  fecha_subida: string;

  paciente_id: number;
  paciente_nombre: string;
  paciente_correo: string;
  paciente_empresa_id: number;
}

/* ===== Contacto (público) ===== */
export type ContactPayload = {
  correo: string;
  mensaje: string;
};

// tu endpoint devuelve { ok: true } (te dejo “id” opcional por si luego quieres devolver tracking)
export type ContactResponse = { ok: true; id?: string };

export interface EmpresaPublica {
  id_empresa: number;
  nombre: string;
}
/* ===== Admin (MediCloud) ===== */
export interface Empresa {
  id_empresa: number;
  nombre: string;
  estado: 'ACTIVA' | 'INACTIVA' | string;
  creado_en?: string;
}

export interface TrabajadorEmpresa {
  id_cuenta: number;
  correo: string;
  nombre: string;
  tipo_cuenta: 'TRABAJADOR' | string;
  estado: 'ACTIVA' | 'BLOQUEADA' | 'BAJA' | string;
  creado_en?: string;
  id_empresa?: number | null;
}
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /* ===== Auth ===== */
login(email: string, password: string) {
  return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password });
}


  me(token: string) {
    return this.http.get(`${this.base}/me`, { headers: this.authHeaders(token) });
  }

  /* ===== Files ===== */
  files(token: string) {
    return this.http.get<Archivo[]>(`${this.base}/files`, {
      headers: this.authHeaders(token),
      params: { ts: Date.now().toString() }, // cache-buster
    });
  }

  uploadFile(token: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/files/upload`, form, {
      headers: this.authHeaders(token),
    });
  }

  deleteFile(token: string, id_archivo: number) {
    return this.http.delete(`${this.base}/files/${id_archivo}`, {
      headers: this.authHeaders(token),
    });
  }

  /* ===== Tickets ===== */
  tickets(token: string) {
    return this.http.get<Ticket[]>(`${this.base}/tickets`, {
      headers: this.authHeaders(token),
      params: { ts: Date.now().toString() }, // cache-buster
    });
  }

  ticketDetail(token: string, id: string | number) {
    return this.http.get<TicketDetailResponse>(`${this.base}/tickets/${id}`, {
      headers: this.authHeaders(token),
      params: { ts: Date.now().toString() }, // cache-buster
    });
  }

  createTicket(token: string, payload: TicketCreatePayload) {
    return this.http.post<TicketCreateResponse>(`${this.base}/tickets`, payload, {
      headers: this.authHeaders(token),
    });
  }

  addTicketMessage(token: string, id: string | number, cuerpo: string) {
    return this.http.post<{ ok: true }>(
      `${this.base}/tickets/${id}/messages`,
      { cuerpo },
      { headers: this.authHeaders(token) }
    );
  }

  updateTicket(token: string, id: string | number, payload: TicketUpdatePayload) {
    return this.http.patch<{ ok: true }>(`${this.base}/tickets/${id}`, payload, {
      headers: this.authHeaders(token),
    });
  }

  /* ===== Contacto (público, sin token) ===== */
  sendContact(payload: ContactPayload) {
    return this.http.post<ContactResponse>(`${this.base}/contact`, payload, {
      params: { ts: Date.now().toString() }, // evita caches raras/proxies
    });
  }

  private authHeaders(token: string) {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  register(payload: RegisterPayload) {
  return this.http.post<LoginResponse>(`${this.base}/auth/register`, payload);
}

getEmpresasPublicas() {
  return this.http.get<EmpresaPublica[]>(`${this.base}/empresas/public`, {
    params: { ts: Date.now().toString() },
  });
}

staffFiles(token: string, q: string) {
  return this.http.get<StaffArchivoRow[]>(`${this.base}/staff/files`, {
    headers: this.authHeaders(token),
    params: { q: q || '', ts: Date.now().toString() }, // cache-buster
  });
}

/* ===== Admin (MediCloud) ===== */
adminEmpresas(token: string) {
  return this.http.get<Empresa[]>(`${this.base}/admin/empresas`, {
    headers: this.authHeaders(token),
    params: { ts: Date.now().toString() },
  });
}

adminEmpresaTrabajadores(token: string, idEmpresa: number) {
  return this.http.get<TrabajadorEmpresa[]>(
    `${this.base}/admin/empresas/${idEmpresa}/trabajadores`,
    {
      headers: this.authHeaders(token),
      params: { ts: Date.now().toString() },
    }
  );
}

}
