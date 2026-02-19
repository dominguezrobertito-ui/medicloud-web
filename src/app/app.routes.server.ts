import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas que sí puedes prerenderizar
  { path: '',         renderMode: RenderMode.Prerender },
  { path: 'login',    renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'contacto', renderMode: RenderMode.Prerender },

  // ✅ RUTAS CON PARÁMETROS: NO PRERENDER (evita el error de getPrerenderParams)
  // RenderMode.Client = CSR (client-side rendering). :contentReference[oaicite:1]{index=1}
  { path: 'tickets/:id',                     renderMode: RenderMode.Client },
  { path: 'admin/empresas/:id/trabajadores', renderMode: RenderMode.Client },

  // El resto de rutas (incluye /cliente/archivos, /trabajador/..., etc.)
  // mejor dejarlas en CSR también para evitar sorpresas.
  { path: '**', renderMode: RenderMode.Client },
];
