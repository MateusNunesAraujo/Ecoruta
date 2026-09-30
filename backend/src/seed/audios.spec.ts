import { nombreAudioSeguro } from './audios.js';

describe('nombreAudioSeguro', () => {
  it.each([
    ['Adiós-Miraña (mp3cut.net).m4a', 'adios_mirana.m4a'],
    ['Como te llamas_Murui (mp3cut.net).m4a', 'como_te_llamas_murui.m4a'],
    ['Hola_Tikuna (mp3cut.net).M4A', 'hola_tikuna.m4a'],
    ['Casabe_Bora(mp3cut.net).mp3', 'casabe_bora.mp3'],
    ['Buenas_tardes_Boramp3cut.net).mp3', 'buenas_tardes_bora.mp3'],
    ['Corazón  (copia).mp3', 'corazon_copia.mp3'],
  ])('"%s" -> "%s"', (original, esperado) => {
    expect(nombreAudioSeguro(original)).toBe(esperado);
  });

  it('no cambia un nombre que ya es seguro (se puede ejecutar varias veces)', () => {
    expect(nombreAudioSeguro('hola_tikuna.m4a')).toBe('hola_tikuna.m4a');
  });
});
