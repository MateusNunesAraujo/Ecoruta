import type { DeepPartial } from 'typeorm';
import {
  ESTADOS_FICHA,
  TIPOS_FICHA,
  type EstadoFicha,
} from '../cultural/catalogos.js';
import type { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import type { Lengua } from '../cultural/lengua.entity.js';
import type { Comunidad } from '../emprendimientos/comunidad.entity.js';
import type { Emprendimiento } from '../emprendimientos/emprendimiento.entity.js';
import type { Experiencia } from '../emprendimientos/experiencia.entity.js';
import type { FechaBloqueada } from '../emprendimientos/fecha-bloqueada.entity.js';
import {
  DIAS_SEMANA,
  DIFICULTADES,
  INTERESES,
  type Interes,
} from '../emprendimientos/intereses.js';
import { CATEGORIAS_FAQ } from '../faq/catalogos.js';
import type { PreguntaFrecuente } from '../faq/pregunta-frecuente.entity.js';
import { esEnlace, nombreAudioSeguro } from './audios.js';
import { leerHoja, type Libro } from './excel.js';
import type { LectorFila } from './lector-fila.js';
import type { Problemas } from './problemas.js';

// Columnas que se leen de cada hoja (fila 1 del Excel).
// Las hojas Instrucciones, Revision y Listas no se leen.
const COLUMNAS = {
  Lenguas: [
    'id',
    'nombre_comun',
    'autodenominacion',
    'descripcion_es',
    'descripcion_en',
    'descripcion_pt',
    'fuente',
  ],
  Comunidades: [
    'id',
    'nombre',
    'pueblos',
    'lengua_id',
    'referencia_ubicacion',
    'latitud',
    'longitud',
    'como_llegar',
    'normas_visita',
    'fuente',
  ],
  Emprendimientos: [
    'id',
    'nombre',
    'comunidad_id',
    'responsable',
    'whatsapp',
    'descripcion_es',
    'descripcion_en',
    'descripcion_pt',
    'idiomas_guias',
    'fotos',
    'consentimiento',
    'fecha_consentimiento',
    'es_ficticio',
  ],
  Experiencias: [
    'id',
    'emprendimiento_id',
    'nombre_es',
    'nombre_en',
    'nombre_pt',
    'descripcion_es',
    'descripcion_en',
    'descripcion_pt',
    'intereses',
    'duracion_horas',
    'hora_salida',
    'dias_operacion',
    'capacidad',
    'precio_cop',
    'incluye',
    'no_incluye',
    'que_llevar',
    'dificultad',
    'punto_encuentro',
    'latitud',
    'longitud',
    'cancelacion',
  ],
  Fechas_bloqueadas: ['experiencia_id', 'fecha', 'motivo'],
  Fichas_culturales: [
    'id',
    'lengua_id',
    'tipo',
    'tema',
    'texto_original',
    'significado_es',
    'significado_en',
    'significado_pt',
    'pronunciacion',
    'audio',
    'contexto',
    'narrativa',
    'fuente',
    'comunidad_o_hablante',
    'permiso_uso',
    'estado',
    'verificado_por',
    'experiencia_id',
  ],
  Preguntas_frecuentes: [
    'id',
    'categoria',
    'pregunta_es',
    'respuesta_es',
    'pregunta_en',
    'respuesta_en',
    'pregunta_pt',
    'respuesta_pt',
    'fuente',
    'fecha_revision',
  ],
} as const;

export interface DatosExcel {
  lenguas: DeepPartial<Lengua>[];
  comunidades: DeepPartial<Comunidad>[];
  emprendimientos: DeepPartial<Emprendimiento>[];
  experiencias: DeepPartial<Experiencia>[];
  fechasBloqueadas: DeepPartial<FechaBloqueada>[];
  fichas: DeepPartial<FichaCultural>[];
  preguntas: DeepPartial<PreguntaFrecuente>[];
  // Textos en lengua indígena cuya codificación cambió al normalizar a NFC.
  textosNormalizados: number;
  audiosUsados: Set<string>;
}

// "Miércoles" -> "miercoles"
function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// Lee el código de la fila y revisa que no esté repetido en la hoja.
function leerId(fila: LectorFila, columna: string, vistos: Set<string>) {
  const id = fila.texto(columna)?.toUpperCase() ?? null;
  fila.id = id;
  if (id === null) return null;
  if (vistos.has(id)) {
    fila.error(`Código repetido: ${id} ya aparece antes. Se omitió la fila.`);
    return null;
  }
  vistos.add(id);
  return id;
}

// Código que apunta a otra hoja. Si no existe, se reporta y se deja vacío.
function referenciaOpcional(
  fila: LectorFila,
  columna: string,
  validos: Set<string>,
  hojaDestino: string,
): string | null {
  const codigo = fila.texto(columna)?.toUpperCase() ?? null;
  if (codigo === null) return null;
  if (!validos.has(codigo)) {
    fila.error(
      `"${columna}" = ${codigo} no existe (o no se cargó) en la hoja ` +
        `${hojaDestino}. Se dejó vacío.`,
    );
    return null;
  }
  return codigo;
}

// Código obligatorio que apunta a otra hoja. Si falla, la fila se omite.
function referenciaObligatoria(
  fila: LectorFila,
  columna: string,
  validos: Set<string>,
  hojaDestino: string,
): string | null {
  const codigo = fila.texto(columna)?.toUpperCase() ?? null;
  if (codigo === null) {
    fila.error(`Falta "${columna}" (obligatorio). Se omitió la fila.`);
    return null;
  }
  if (!validos.has(codigo)) {
    fila.error(
      `"${columna}" = ${codigo} no existe (o no se cargó) en la hoja ` +
        `${hojaDestino}. Se omitió la fila.`,
    );
    return null;
  }
  return codigo;
}

export function transformarLibro(
  libro: Libro,
  audiosDisponibles: Set<string>,
  problemas: Problemas,
): DatosExcel {
  let textosNormalizados = 0;
  const audiosUsados = new Set<string>();

  // Textos en lengua indígena: se normalizan a Unicode NFC. No cambia ninguna
  // letra, solo unifica cómo se codifican (ej. "ü" como un solo carácter).
  const textoIndigena = (fila: LectorFila, columna: string) => {
    const texto = fila.texto(columna);
    if (texto === null) return null;
    const normalizado = texto.normalize('NFC');
    if (normalizado !== texto) textosNormalizados++;
    return normalizado;
  };

  const hoja = (nombre: keyof typeof COLUMNAS, clave = 'id') =>
    leerHoja(libro, nombre, COLUMNAS[nombre], clave, problemas);

  // ---------- Lenguas ----------
  const lenguas: DeepPartial<Lengua>[] = [];
  const idsLenguas = new Set<string>();
  for (const fila of hoja('Lenguas')) {
    const id = leerId(fila, 'id', idsLenguas);
    const nombreComun = fila.obligatorio('nombre_comun');
    if (!id || !nombreComun) {
      if (id) idsLenguas.delete(id);
      continue;
    }
    lenguas.push({
      id,
      nombreComun,
      autodenominacion: textoIndigena(fila, 'autodenominacion'),
      descripcionEs: fila.texto('descripcion_es'),
      descripcionEn: fila.texto('descripcion_en'),
      descripcionPt: fila.texto('descripcion_pt'),
      fuente: fila.texto('fuente'),
    });
  }

  // ---------- Comunidades ----------
  const comunidades: DeepPartial<Comunidad>[] = [];
  const idsComunidades = new Set<string>();
  for (const fila of hoja('Comunidades')) {
    const id = leerId(fila, 'id', idsComunidades);
    const nombre = fila.obligatorio('nombre');
    if (!id || !nombre) {
      if (id) idsComunidades.delete(id);
      continue;
    }
    comunidades.push({
      id,
      nombre,
      pueblos: fila.texto('pueblos'),
      // Puede estar vacía (ej. COM-07, pueblo Cocama).
      lenguaId: referenciaOpcional(fila, 'lengua_id', idsLenguas, 'Lenguas'),
      referenciaUbicacion: fila.texto('referencia_ubicacion'),
      latitud: fila.numero('latitud'),
      longitud: fila.numero('longitud'),
      comoLlegar: fila.texto('como_llegar'),
      normasVisita: fila.texto('normas_visita'),
      fuente: fila.texto('fuente'),
    });
  }

  // ---------- Emprendimientos ----------
  const emprendimientos: DeepPartial<Emprendimiento>[] = [];
  const idsEmprendimientos = new Set<string>();
  for (const fila of hoja('Emprendimientos')) {
    const id = leerId(fila, 'id', idsEmprendimientos);
    const nombre = fila.obligatorio('nombre');
    if (!id || !nombre) {
      if (id) idsEmprendimientos.delete(id);
      continue;
    }
    // Ley 1581 de 2012: sin autorización no se publica.
    if (fila.siNo('consentimiento') !== true) {
      fila.error('No tiene consentimiento = Si (Ley 1581). No se cargó.');
      idsEmprendimientos.delete(id);
      continue;
    }
    let esFicticio = fila.siNo('es_ficticio');
    if (esFicticio === null) {
      fila.aviso('es_ficticio vacío: se marcó como ficticio por precaución.');
      esFicticio = true;
    }
    emprendimientos.push({
      id,
      nombre,
      // Puede estar vacía: reservas privadas sin comunidad.
      comunidadId: referenciaOpcional(
        fila,
        'comunidad_id',
        idsComunidades,
        'Comunidades',
      ),
      responsable: fila.texto('responsable'),
      whatsapp: fila.texto('whatsapp'),
      descripcionEs: fila.texto('descripcion_es'),
      descripcionEn: fila.texto('descripcion_en'),
      descripcionPt: fila.texto('descripcion_pt'),
      idiomasGuias: fila.lista('idiomas_guias'),
      fotos: fila.lista('fotos'),
      fechaConsentimiento: fila.fecha('fecha_consentimiento'),
      esFicticio,
    });
  }

  // ---------- Experiencias ----------
  const experiencias: DeepPartial<Experiencia>[] = [];
  const idsExperiencias = new Set<string>();
  for (const fila of hoja('Experiencias')) {
    const id = leerId(fila, 'id', idsExperiencias);
    const emprendimientoId = id
      ? referenciaObligatoria(
          fila,
          'emprendimiento_id',
          idsEmprendimientos,
          'Emprendimientos',
        )
      : null;
    const nombreEs = fila.obligatorio('nombre_es');
    if (!id || !emprendimientoId || !nombreEs) {
      if (id) idsExperiencias.delete(id);
      continue;
    }

    const intereses: Interes[] = [];
    for (const etiqueta of fila.lista('intereses').map(sinTildes)) {
      if ((INTERESES as readonly string[]).includes(etiqueta)) {
        intereses.push(etiqueta as Interes);
      } else {
        fila.error(
          `Interés desconocido "${etiqueta}": se omitió esa etiqueta.`,
        );
      }
    }
    if (intereses.length === 0) {
      fila.aviso('Sin intereses válidos: no aparecerá al filtrar por interés.');
    }

    const diasOperacion: string[] = [];
    for (const dia of fila.lista('dias_operacion').map(sinTildes)) {
      if ((DIAS_SEMANA as readonly string[]).includes(dia)) {
        diasOperacion.push(dia);
      } else {
        fila.error(`Día desconocido "${dia}": se omitió.`);
      }
    }

    let dificultad = fila.texto('dificultad');
    if (dificultad !== null) {
      dificultad = sinTildes(dificultad);
      if (!(DIFICULTADES as readonly string[]).includes(dificultad)) {
        fila.error(`Dificultad "${dificultad}" no válida (baja/media/alta).`);
        dificultad = null;
      }
    }

    const horas = fila.numero('duracion_horas');
    const capacidad = fila.entero('capacidad');
    const precioCop = fila.entero('precio_cop');
    if (capacidad === null || precioCop === null) {
      const faltan = [
        capacidad === null ? 'capacidad' : null,
        precioCop === null ? 'precio_cop' : null,
      ].filter(Boolean);
      fila.aviso(`Falta ${faltan.join(' y ')}: no se podrá reservar ni pagar.`);
    }

    experiencias.push({
      id,
      emprendimientoId,
      nombreEs,
      nombreEn: fila.texto('nombre_en'),
      nombrePt: fila.texto('nombre_pt'),
      descripcionEs: fila.texto('descripcion_es'),
      descripcionEn: fila.texto('descripcion_en'),
      descripcionPt: fila.texto('descripcion_pt'),
      intereses,
      duracionMinutos: horas === null ? null : Math.round(horas * 60),
      horaSalida: fila.hora('hora_salida'),
      diasOperacion,
      capacidad,
      precioCop,
      incluye: fila.texto('incluye'),
      noIncluye: fila.texto('no_incluye'),
      queLlevar: fila.texto('que_llevar'),
      dificultad,
      puntoEncuentro: fila.texto('punto_encuentro'),
      latitud: fila.numero('latitud'),
      longitud: fila.numero('longitud'),
      cancelacion: fila.texto('cancelacion'),
    });
  }

  // ---------- Fechas bloqueadas ----------
  const fechasBloqueadas: DeepPartial<FechaBloqueada>[] = [];
  const clavesFechas = new Set<string>();
  for (const fila of hoja('Fechas_bloqueadas', 'experiencia_id')) {
    fila.id = fila.texto('experiencia_id')?.toUpperCase() ?? null;
    const experienciaId = referenciaObligatoria(
      fila,
      'experiencia_id',
      idsExperiencias,
      'Experiencias',
    );
    const fecha = fila.fecha('fecha');
    if (fecha === null && fila.texto('fecha') === null) {
      fila.error('Falta "fecha" (obligatoria). Se omitió la fila.');
    }
    if (!experienciaId || !fecha) continue;
    const clave = `${experienciaId}|${fecha}`;
    if (clavesFechas.has(clave)) {
      fila.error(`Fecha repetida para ${experienciaId}: ${fecha}. Se omitió.`);
      continue;
    }
    clavesFechas.add(clave);
    fechasBloqueadas.push({
      experienciaId,
      fecha,
      motivo: fila.texto('motivo'),
    });
  }

  // ---------- Fichas culturales ----------
  const fichas: DeepPartial<FichaCultural>[] = [];
  const idsFichas = new Set<string>();
  for (const fila of hoja('Fichas_culturales')) {
    const id = leerId(fila, 'id', idsFichas);
    const lenguaId = id
      ? referenciaObligatoria(fila, 'lengua_id', idsLenguas, 'Lenguas')
      : null;
    const tema = fila.obligatorio('tema')?.toLowerCase() ?? null;
    const textoOriginal = textoIndigena(fila, 'texto_original');
    if (textoOriginal === null) {
      fila.error('Falta "texto_original" (obligatorio). Se omitió la fila.');
    }
    if (!id || !lenguaId || !tema || !textoOriginal) {
      if (id) idsFichas.delete(id);
      continue;
    }

    if (!/^[a-z0-9_]+$/.test(tema)) {
      fila.aviso(`Tema "${tema}" con espacios, tildes o símbolos.`);
    }

    const tipo = fila.obligatorio('tipo')?.toLowerCase() ?? 'palabra';
    if (!(TIPOS_FICHA as readonly string[]).includes(tipo)) {
      fila.aviso(`Tipo "${tipo}" no está en la lista de tipos de ficha.`);
    }

    // Estado: ante cualquier duda, PENDIENTE (así no se muestra al turista).
    let estado = (fila.texto('estado')?.toUpperCase() ??
      null) as EstadoFicha | null;
    if (estado === null || !ESTADOS_FICHA.includes(estado)) {
      fila.error(
        `Estado "${estado ?? ''}" no válido: se cargó como PENDIENTE ` +
          '(no se muestra al turista).',
      );
      estado = 'PENDIENTE';
    }

    let audio: string | null = null;
    const audioExcel = fila.texto('audio');
    if (audioExcel !== null) {
      if (esEnlace(audioExcel)) {
        audio = audioExcel;
      } else {
        const seguro = nombreAudioSeguro(audioExcel);
        if (audiosDisponibles.has(seguro)) {
          audio = seguro;
          audiosUsados.add(seguro);
        } else {
          fila.error(
            `El audio "${audioExcel}" no está en frontend/www/audio ` +
              `(se buscó "${seguro}"). Se cargó la ficha sin audio.`,
          );
        }
      }
    }

    const fuente = fila.texto('fuente');
    const comunidadOHablante = fila.texto('comunidad_o_hablante');
    if (estado === 'VERIFICADA' && (!fuente || !comunidadOHablante)) {
      fila.aviso(
        'VERIFICADA sin fuente o sin comunidad_o_hablante: la regla 1 de ' +
          'CLAUDE.md pide ambas para atribuir el contenido.',
      );
    }

    // experiencia_id puede traer varios códigos: "EXP-01, EXP-03".
    const experienciasFicha: { id: string }[] = [];
    for (const codigo of fila.lista('experiencia_id')) {
      const idExperiencia = codigo.toUpperCase();
      if (idsExperiencias.has(idExperiencia)) {
        experienciasFicha.push({ id: idExperiencia });
      } else {
        fila.error(
          `experiencia_id ${idExperiencia} no existe (o no se cargó) en la ` +
            'hoja Experiencias. Se omitió ese enlace.',
        );
      }
    }

    fichas.push({
      id,
      lenguaId,
      tipo,
      tema,
      textoOriginal,
      significadoEs: fila.texto('significado_es'),
      significadoEn: fila.texto('significado_en'),
      significadoPt: fila.texto('significado_pt'),
      pronunciacion: textoIndigena(fila, 'pronunciacion'),
      audio,
      contexto: fila.texto('contexto'),
      narrativa: fila.texto('narrativa'),
      fuente,
      comunidadOHablante,
      permisoUso: fila.texto('permiso_uso'),
      estado,
      verificadoPor: fila.texto('verificado_por'),
      experiencias: experienciasFicha,
    });
  }

  // ---------- Preguntas frecuentes ----------
  const preguntas: DeepPartial<PreguntaFrecuente>[] = [];
  const idsPreguntas = new Set<string>();
  for (const fila of hoja('Preguntas_frecuentes')) {
    const id = leerId(fila, 'id', idsPreguntas);
    const categoria = fila.obligatorio('categoria')?.toLowerCase() ?? null;
    const preguntaEs = fila.obligatorio('pregunta_es');
    const respuestaEs = fila.obligatorio('respuesta_es');
    if (!id || !categoria || !preguntaEs || !respuestaEs) {
      if (id) idsPreguntas.delete(id);
      continue;
    }
    if (!(CATEGORIAS_FAQ as readonly string[]).includes(categoria)) {
      fila.error(
        `Categoría "${categoria}" no está en la lista: no aparecerá al ` +
          'filtrar por categoría.',
      );
    }
    preguntas.push({
      id,
      categoria,
      preguntaEs,
      respuestaEs,
      preguntaEn: fila.texto('pregunta_en'),
      respuestaEn: fila.texto('respuesta_en'),
      preguntaPt: fila.texto('pregunta_pt'),
      respuestaPt: fila.texto('respuesta_pt'),
      fuente: fila.texto('fuente'),
      fechaRevision: fila.fecha('fecha_revision'),
    });
  }

  return {
    lenguas,
    comunidades,
    emprendimientos,
    experiencias,
    fechasBloqueadas,
    fichas,
    preguntas,
    textosNormalizados,
    audiosUsados,
  };
}
