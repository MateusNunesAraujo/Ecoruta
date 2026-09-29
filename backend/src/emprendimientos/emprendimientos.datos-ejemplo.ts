import type { Emprendimiento } from './emprendimiento.entity.js';

// Emprendimientos FICTICIOS para desarrollo y demo (esEjemplo = true).
// - Las comunidades son inventadas a propósito: no atribuir a comunidades
//   reales ofertas que no han confirmado.
// - Sin palabras en lenguas indígenas (regla 1 de CLAUDE.md).
// - Teléfonos falsos y ubicaciones aproximadas.
// Los emprendimientos reales los carga el equipo con autorización.
type DatoEjemplo = Omit<
  Emprendimiento,
  'id' | 'esEjemplo' | 'creadoEn' | 'actualizadoEn'
>;

export const EMPRENDIMIENTOS_EJEMPLO: DatoEjemplo[] = [
  {
    nombre: 'Avistamiento de aves al amanecer',
    comunidad: 'Comunidad Ejemplo Lago Verde',
    descripcionEs:
      'Recorrido en canoa al amanecer con guía local para observar aves ' +
      'del bosque inundable. Incluye binoculares y desayuno.',
    descripcionEn:
      'Sunrise canoe trip with a local guide to watch birds of the flooded ' +
      'forest. Binoculars and breakfast included.',
    descripcionPt:
      'Passeio de canoa ao amanhecer com guia local para observar aves da ' +
      'floresta alagada. Inclui binóculos e café da manhã.',
    intereses: ['aves', 'caminata'],
    precioBaseCop: 120000,
    duracionMinutos: 240,
    capacidadPorFecha: 8,
    latitud: -4.12,
    longitud: -70.05,
    contacto: '+57 300 000 0001',
    fotoUrl: null,
  },
  {
    nombre: 'Delfines rosados en el río',
    comunidad: 'Comunidad Ejemplo Río Arriba',
    descripcionEs:
      'Salida en bote a los lagos donde se observan delfines rosados y ' +
      'grises, con explicación sobre su cuidado.',
    descripcionEn:
      'Boat trip to the lakes where pink and grey river dolphins can be ' +
      'seen, with an explanation of how they are protected.',
    descripcionPt:
      'Passeio de barco aos lagos onde se observam botos cor-de-rosa e ' +
      'cinzas, com explicação sobre sua proteção.',
    intereses: ['delfines'],
    precioBaseCop: 150000,
    duracionMinutos: 180,
    capacidadPorFecha: 10,
    latitud: -3.85,
    longitud: -70.3,
    contacto: '+57 300 000 0002',
    fotoUrl: null,
  },
  {
    nombre: 'Cocina tradicional del río',
    comunidad: 'Comunidad Ejemplo Las Palmas',
    descripcionEs:
      'Taller de cocina con pescado, yuca y frutos amazónicos preparados ' +
      'por familias de la comunidad. Almuerzo incluido.',
    descripcionEn:
      'Cooking workshop with fish, cassava and Amazonian fruits prepared ' +
      'by local families. Lunch included.',
    descripcionPt:
      'Oficina de culinária com peixe, mandioca e frutas amazônicas ' +
      'preparados por famílias da comunidade. Almoço incluído.',
    intereses: ['gastronomia'],
    precioBaseCop: 90000,
    duracionMinutos: 180,
    capacidadPorFecha: 12,
    latitud: -4.05,
    longitud: -70.1,
    contacto: '+57 300 000 0003',
    fotoUrl: null,
  },
  {
    nombre: 'Taller de artesanías en fibra natural',
    comunidad: 'Comunidad Ejemplo Kilómetro Norte',
    descripcionEs:
      'Aprende a tejer una pieza pequeña con fibras naturales junto a ' +
      'artesanas de la comunidad. Te llevas tu pieza.',
    descripcionEn:
      'Learn to weave a small piece with natural fibres alongside local ' +
      'artisans. You take your piece home.',
    descripcionPt:
      'Aprenda a tecer uma pequena peça com fibras naturais junto a ' +
      'artesãs da comunidade. Você leva sua peça.',
    intereses: ['artesanias'],
    precioBaseCop: 80000,
    duracionMinutos: 150,
    capacidadPorFecha: 6,
    latitud: -4.15,
    longitud: -69.95,
    contacto: '+57 300 000 0004',
    fotoUrl: null,
  },
  {
    nombre: 'Caminata por la selva y plantas medicinales',
    comunidad: 'Comunidad Ejemplo Monte Alto',
    descripcionEs:
      'Caminata guiada por senderos de selva con explicación de plantas ' +
      'y árboles que la comunidad usa y protege.',
    descripcionEn:
      'Guided jungle walk explaining the plants and trees the community ' +
      'uses and protects.',
    descripcionPt:
      'Caminhada guiada por trilhas da selva com explicação das plantas e ' +
      'árvores que a comunidade usa e protege.',
    intereses: ['caminata', 'aves'],
    precioBaseCop: 100000,
    duracionMinutos: 300,
    capacidadPorFecha: 10,
    latitud: -3.95,
    longitud: -70.2,
    contacto: '+57 300 000 0005',
    fotoUrl: null,
  },
  {
    nombre: 'Día completo: río, cocina y artesanía',
    comunidad: 'Comunidad Ejemplo Río Arriba',
    descripcionEs:
      'Jornada completa que combina paseo en bote para ver delfines, ' +
      'almuerzo tradicional y taller corto de artesanía.',
    descripcionEn:
      'Full-day experience combining a boat trip to see dolphins, a ' +
      'traditional lunch and a short handicraft workshop.',
    descripcionPt:
      'Dia inteiro combinando passeio de barco para ver botos, almoço ' +
      'tradicional e uma breve oficina de artesanato.',
    intereses: ['delfines', 'gastronomia', 'artesanias'],
    precioBaseCop: 250000,
    duracionMinutos: 480,
    capacidadPorFecha: 8,
    latitud: -3.86,
    longitud: -70.28,
    contacto: '+57 300 000 0002',
    fotoUrl: null,
  },
];
