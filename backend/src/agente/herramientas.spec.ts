import type { CulturalService } from '../cultural/cultural.service.js';
import type { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import type { ExperienciasService } from '../emprendimientos/experiencias.service.js';
import type { EmprendimientosService } from '../emprendimientos/emprendimientos.service.js';
import type { FaqService } from '../faq/faq.service.js';
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
  // Como el CulturalService real: reconoce Tikuna por sus nombres.
  const resolverLengua = vi.fn((texto: string) =>
    Promise.resolve(
      /tikuna|magüta/i.test(texto)
        ? { id: 'L-TIK', nombreComun: 'Tikuna' }
        : null,
    ),
  );
  const cultural = {
    listar,
    resolverLengua,
    nombresDeLenguas: () => Promise.resolve(['Tikuna', 'Bora']),
    temasDeLengua: () => Promise.resolve(['gracias', 'hola', 'maloca']),
  } as unknown as CulturalService;
  const herramientas = new HerramientasAgente(
    {} as ExperienciasService,
    cultural,
    {} as ReservasService,
    {} as PagosService,
    {} as FaqService,
    {} as EmprendimientosService,
  );

  afterEach(() => listar.mockClear());

  it('reconoce la lengua por su autodenominación ("Magüta" = Tikuna)', async () => {
    await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'gracias', lengua: 'Magüta' },
      'es',
    );
    expect(listar).toHaveBeenCalledWith({ lenguaId: 'L-TIK', tema: 'gracias' });
  });

  it('si el LLM no pasa la lengua, usa la última que nombró el turista', async () => {
    await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'maloca' },
      'es',
      ['Cómo se dice delfín en lengua magüta', 'Ahora maloca'],
    );
    expect(listar).toHaveBeenCalledWith({ lenguaId: 'L-TIK', tema: 'maloca' });
  });

  it('"en todas las lenguas": no se limita a la lengua anterior', async () => {
    await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'maloca' },
      'es',
      [
        'Cómo se dice delfín en tikuna',
        'Muéstrame maloca en todas las lenguas',
      ],
    );
    expect(listar).toHaveBeenCalledWith({
      lenguaId: undefined,
      tema: 'maloca',
    });
  });

  it('lengua desconocida: no muestra fichas de otras lenguas', async () => {
    const r = await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'delfin', lengua: 'quechua' },
      'es',
    );
    expect(listar).not.toHaveBeenCalled();
    expect(r.tarjetas).toEqual([]);
    expect(JSON.stringify(r.paraModelo)).toContain('Tikuna, Bora');
  });

  it('tema que no existe en esa lengua: dice cuáles sí hay', async () => {
    listar.mockResolvedValueOnce([]);
    const r = await herramientas.ejecutar(
      'obtener_contenido_cultural',
      { tema: 'delfin', lengua: 'tikuna' },
      'es',
    );
    expect(r.tarjetas).toEqual([]);
    expect(r.paraModelo).toMatchObject({
      mostradas: 0,
      lengua: 'Tikuna',
      temasDisponibles: ['gracias', 'hola', 'maloca'],
    });
  });

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
