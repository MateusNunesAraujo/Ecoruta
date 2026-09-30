// Configuración que cambia entre la versión web y la app Android.

// ¿Corre dentro de la app Android (Capacitor, Bloque 8)?
export const ES_APP = Boolean(window.Capacitor?.isNativePlatform?.());

// URL base de la API:
// - Web: NestJS sirve esta misma página, así que basta la ruta relativa.
// - App: la página corre en el teléfono y necesita la URL completa del
//   backend desplegado (Bloque 9). Cambiarla cuando exista.
export const API_BASE = ES_APP ? 'https://CAMBIAR-POR-LA-URL-DESPLEGADA' : '';

// Referencia de precio para turistas de Brasil (triple frontera).
// Tasa aproximada (no oficial) consultada el 2026-09-30: 1 BRL ≈ 634-635 COP
// (Wise y otros conversores). Actualizarla si cambia mucho.
export const COP_POR_BRL = 635;
