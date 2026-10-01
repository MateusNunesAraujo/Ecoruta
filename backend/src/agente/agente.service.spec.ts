import { AgenteService } from './agente.service.js';
import type { HerramientasAgente } from './herramientas.js';
import {
  ErrorProveedorLlm,
  type LlmProvider,
} from './providers/llm-provider.interface.js';
import { MockProvider } from './providers/mock.provider.js';

// Proveedor que siempre falla, como Gemini o Groq sin cuota (429).
const sinCuota = (nombre: string): LlmProvider => ({
  nombre,
  generar: () =>
    Promise.reject(new ErrorProveedorLlm(nombre, 'HTTP 429: Rate limit')),
});

const herramientas = {
  definiciones: () => Promise.resolve([]),
  ejecutar: () =>
    Promise.resolve({ paraModelo: { experiencias: [] }, tarjetas: [] }),
} as unknown as HerramientasAgente;

describe('AgenteService: respaldo entre proveedores', () => {
  it('si Gemini y Groq fallan, responde el Mock (no un 503)', async () => {
    const agente = new AgenteService(
      [sinCuota('gemini'), sinCuota('groq'), new MockProvider()],
      herramientas,
    );
    const r = await agente.responder({ mensaje: 'Hola', idioma: 'es' });
    expect(r.proveedor).toBe('mock');
    expect(r.texto).toContain('Ecoruta');
  });

  it('si el proveedor falla a mitad del mensaje, el Mock lo termina', async () => {
    let vueltas = 0;
    const seAgotaEnLaSegunda: LlmProvider = {
      nombre: 'groq',
      generar: () =>
        ++vueltas === 1
          ? Promise.resolve({
              texto: null,
              llamadas: [
                { id: 'c1', nombre: 'buscar_experiencias', argumentos: {} },
              ],
            })
          : Promise.reject(new ErrorProveedorLlm('groq', 'HTTP 429')),
    };
    const agente = new AgenteService(
      [seAgotaEnLaSegunda, new MockProvider()],
      herramientas,
    );
    const r = await agente.responder({
      mensaje: 'Quiero ver aves',
      idioma: 'es',
    });
    expect(r.proveedor).toBe('mock');
    expect(r.texto).toContain('No encontré');
  });

  it('si todos fallan, responde 503 con un mensaje amable', async () => {
    const agente = new AgenteService([sinCuota('gemini')], herramientas);
    await expect(
      agente.responder({ mensaje: 'Hello', idioma: 'en' }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
