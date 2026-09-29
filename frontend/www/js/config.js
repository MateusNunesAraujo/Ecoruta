// Configuración que cambia entre la versión web y la app Android.

// ¿Corre dentro de la app Android (Capacitor, Bloque 8)?
export const ES_APP = Boolean(window.Capacitor?.isNativePlatform?.());

// URL base de la API:
// - Web: NestJS sirve esta misma página, así que basta la ruta relativa.
// - App: la página corre en el teléfono y necesita la URL completa del
//   backend desplegado (Bloque 9). Cambiarla cuando exista.
export const API_BASE = ES_APP ? 'https://CAMBIAR-POR-LA-URL-DESPLEGADA' : '';

// Referencia de precio para turistas de Brasil (triple frontera).
// ⚠️ Tasa APROXIMADA, no oficial: verificarla antes de la demo.
export const COP_POR_BRL = 730;
