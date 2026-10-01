import type { Idioma } from '../../faq/catalogos.js';

// Formato neutro de la conversación. Cada proveedor (Gemini, Groq, Mock) lo
// traduce al formato de su API. Así el resto del agente no depende de ninguno.

// Herramienta que el LLM puede pedir (parámetros en JSON Schema).
export interface DefinicionHerramienta {
  nombre: string;
  descripcion: string;
  parametros: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface LlamadaHerramienta {
  id: string;
  nombre: string;
  argumentos: Record<string, unknown>;
}

export type TurnoLlm =
  | { tipo: 'usuario'; texto: string }
  | {
      tipo: 'asistente';
      texto: string | null;
      llamadas: LlamadaHerramienta[];
      // Respuesta original del proveedor. Gemini 3 exige devolverla igual
      // (incluye "thoughtSignature") en el turno siguiente.
      crudo?: unknown;
    }
  | {
      tipo: 'resultado';
      llamadaId: string;
      nombre: string;
      resultado: unknown;
    };

export interface PeticionLlm {
  sistema: string;
  turnos: TurnoLlm[];
  herramientas: DefinicionHerramienta[];
  idioma: Idioma;
}

export interface RespuestaLlm {
  texto: string | null;
  llamadas: LlamadaHerramienta[];
  crudo?: unknown;
}

export interface LlmProvider {
  readonly nombre: string;
  generar(peticion: PeticionLlm): Promise<RespuestaLlm>;
}

// Token de inyección de dependencias: el AgenteService pide "LLM_PROVIDER" y
// el módulo decide cuál entregar según la variable LLM_PROVIDER del .env.
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

// Función fetch inyectable: en las pruebas se reemplaza por una simulada.
export type Fetch = typeof fetch;

// Error al hablar con el proveedor (red, cuota agotada, respuesta rara…).
export class ErrorProveedorLlm extends Error {
  constructor(
    readonly proveedor: string,
    mensaje: string,
  ) {
    super(`[${proveedor}] ${mensaje}`);
  }
}
