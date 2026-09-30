import type { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import type { Experiencia } from '../emprendimientos/experiencia.entity.js';
import type { Idioma } from '../faq/catalogos.js';
import type { Disponibilidad } from '../reservas/reservas.service.js';

// Tarjetas: datos que van DIRECTO al frontend, sin pasar por el LLM.
// El frontend decide cómo dibujar cada "tipo".

export interface ResumenExperiencia {
  id: string;
  nombre: string;
  descripcion: string | null;
  emprendimiento: string;
  comunidad: string | null;
  precioCop: number | null;
  duracionMinutos: number | null;
  horaSalida: string | null;
  diasOperacion: string[];
  intereses: string[];
  dificultad: string | null;
  puntoEncuentro: string | null;
  latitud: number | null;
  longitud: number | null;
}

export type Tarjeta =
  | { tipo: 'experiencia'; experiencia: ResumenExperiencia }
  | { tipo: 'ficha_cultural'; ficha: FichaCultural }
  | { tipo: 'disponibilidad'; disponibilidad: Disponibilidad }
  | {
      tipo: 'itinerario';
      dias: { dia: number; experiencias: ResumenExperiencia[] }[];
    }
  // El frontend muestra las reservas pendientes de este teléfono con su
  // botón "Pagar" (Wompi).
  | { tipo: 'pago' }
  | {
      // El turista escribe nombre y email aquí (no en el chat) y el frontend
      // llama a POST /api/reservas. Regla 3: esos datos no pasan por el LLM.
      tipo: 'formulario_reserva';
      experiencia: ResumenExperiencia;
      fecha: string;
      personas: number;
      cuposLibres: number;
      totalCop: number;
    };

// Experiencia -> resumen en el idioma del turista (con español de respaldo).
export function resumirExperiencia(
  experiencia: Experiencia,
  idioma: Idioma,
): ResumenExperiencia {
  const nombres = {
    es: experiencia.nombreEs,
    en: experiencia.nombreEn,
    pt: experiencia.nombrePt,
  };
  const descripciones = {
    es: experiencia.descripcionEs,
    en: experiencia.descripcionEn,
    pt: experiencia.descripcionPt,
  };
  return {
    id: experiencia.id,
    nombre: nombres[idioma] ?? experiencia.nombreEs,
    descripcion: descripciones[idioma] ?? experiencia.descripcionEs,
    emprendimiento: experiencia.emprendimiento?.nombre ?? '',
    comunidad: experiencia.emprendimiento?.comunidad?.nombre ?? null,
    precioCop: experiencia.precioCop,
    duracionMinutos: experiencia.duracionMinutos,
    horaSalida: experiencia.horaSalida,
    diasOperacion: experiencia.diasOperacion,
    intereses: experiencia.intereses,
    dificultad: experiencia.dificultad,
    puntoEncuentro: experiencia.puntoEncuentro,
    latitud: experiencia.latitud,
    longitud: experiencia.longitud,
  };
}
