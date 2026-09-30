import type { CulturalService } from '../cultural/cultural.service.js';
import type { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import type { ExperienciasService } from '../emprendimientos/experiencias.service.js';
import type { PagosService } from '../pagos/pagos.service.js';
import type { ReservasService } from '../reservas/reservas.service.js';
import { HerramientasAgente } from './herramientas.js';

// Regla 2 de CLAUDE.md: el contenido cultural no pasa por el LLM.
describe('HerramientasAgente: obtener_contenido_cultural', () => {
  const ficha = {
    id: 'FIC-03',
    lenguaId: 'L-TIK',
    lengua: { id: 'L-TIK', nombreComun: 'Tikuna' },
    tipo: 'palabra',
    tema: 'gracias',
    textoOriginal: 'Moeüchi',
    pronunciacion: 'Moeichi',
    audio: 'gracias_tikuna.m4a',
    significadoEs: 'Gracias',
    fuente: 'Hablante nativo',
    comunidadOHablante: 'Sergió Ramos del Águila',
    estado: 'VERIFICADA',
  } as unknown as FichaCultural;

  const listar = vi.fn().mockResolvedValue([ficha]);
  const herramientas = new HerramientasAgente(
    {} as ExperienciasService,
    { listar } as unknown as CulturalService,
    {} as ReservasService,
    {} as PagosService,
  );

  it('al LLM solo le llega una referencia; la ficha completa va en la tarjeta', async () => {
    const r = await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'gracias', lengua: 'Tikuna' },
      'en',
    );

    expect(listar).toHaveBeenCalledWith({ lenguaId: 'L-TIK', tema: 'gracias' });
    const paraModelo = JSON.stringify(r.paraModelo);
    for (const privado of [
      'Moeüchi',
      'Moeichi',
      'gracias_tikuna.m4a',
      'Sergió',
    ]) {
      expect(paraModelo).not.toContain(privado);
    }
    expect(r.paraModelo).toMatchObject({ mostradas: 1, ids: ['FIC-03'] });
    expect(r.tarjetas).toEqual([{ tipo: 'ficha_cultural', ficha }]);
  });

  it('una herramienta que no existe devuelve un error al LLM, sin romper', async () => {
    const r = await herramientas.ejecutar('borrar_todo', {}, 'es');
    expect(r.paraModelo).toEqual({
      error: 'La herramienta "borrar_todo" no existe.',
    });
    expect(r.tarjetas).toEqual([]);
  });
});
