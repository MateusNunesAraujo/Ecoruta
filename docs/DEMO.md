# Guía de la demo — Ecoruta Conectada

Ecoruta se publica desde un portátil del equipo con un túnel gratuito de
Cloudflare (sin cuenta ni dominio). El portátil debe estar **encendido y con
internet** durante toda la demo.

## Antes de la demo

**El día anterior**
- [ ] El portátil tiene Docker Desktop, Node y `cloudflared` (`cloudflared --version`).
- [ ] Están el Excel (`docs/datos/Ecoruta_datos.xlsx`) y los audios
      (`frontend/www/audio/`). Ejecutar `npm run seed` en `backend/`: 0 errores.
- [ ] En el `.env` de la raíz:
  - `LLM_PROVIDER=gemini` con `GEMINI_API_KEY` y `GROQ_API_KEY` (si se
    agota la cuota, responde el modo Mock automáticamente).
  - `PAGOS_SIMULADOS=true` (no hay cuenta de Wompi).
- [ ] Ensayar el recorrido completo de abajo con el cronómetro.

**30 minutos antes**
- [ ] Portátil conectado al cargador y **sin suspensión** (Windows:
      Configuración → Sistema → Energía → "Nunca" al estar conectado).
- [ ] Internet: wifi del evento + **datos del celular como respaldo**.
- [ ] Abrir Docker Desktop.
- [ ] Borrar las reservas de los ensayos, para que no ocupen cupos (en la
      raíz del proyecto; borra TODAS las reservas de la base local):
      ```
      docker exec ecoruta-postgres psql -U ecoruta -d ecoruta -c "DELETE FROM intentos_pago" -c "DELETE FROM reservas"
      ```
- [ ] En `backend/`: `npm run demo`. Deja esa ventana abierta.
- [ ] Abrir la dirección desde **un celular con datos móviles** (no con el
      wifi del portátil) para confirmar que funciona desde afuera.
- [ ] Poner `demo/qr-ecoruta.png` en la diapositiva. **Si el comando se
      reinicia, la dirección y el QR cambian**: usar siempre el último.

## Recorrido sugerido (unos 5 minutos)

1. **Escanear el QR** (sin instalar nada). En el inicio, cambiar el idioma a
   portugués: turistas de la triple frontera, precios en COP con referencia
   en reales.
2. **Chat**: "Quero ver botos" → el asistente muestra la experiencia de los
   Lagos de Tarapoto.
3. **Soberanía lingüística**: "¿Cómo se dice gracias en tikuna?" → ficha
   verificada con audio, pronunciación y quién la compartió.
   *Mensaje clave:* la IA nunca ve ni genera palabras indígenas; el contenido
   curado va directo a la pantalla (y el nivel gratuito del LLM no lo usa
   para entrenar).
4. **Reserva**: "Quiero reservar los delfines el sábado para 2 personas" →
   formulario (los datos personales no pasan por la IA) → reserva con cuenta
   regresiva de 15 minutos.
5. **Pago**: "Pagar (simulado)" → "Aprobar" → reserva **confirmada**.
   *Decirlo:* la pasarela es simulada; la integración con Wompi (tarjeta,
   Nequi, PSE) está lista y se activa con las llaves del comercio.
6. **Lenguas**: mostrar las 5 lenguas; Yagua aparece "en proceso de
   validación con la comunidad" (no se inventa contenido).

## Qué decir con honestidad
- Los pagos son simulados en la demo (sin cuenta de Wompi).
- El modo sin conexión y la app Android están en el plan (Bloques 7 y 8),
  aún no implementados.
- Las reservas no llegan todavía a un panel del emprendedor.

## Plan B
| Si pasa… | Hacer |
|---|---|
| Se cae internet del evento | Compartir datos del celular al portátil; si la dirección cambió, mostrar el nuevo QR |
| No hay internet de ningún tipo | Mostrar la app en el portátil: http://localhost:3000 (funciona sin túnel) |
| El asistente responde "más simple" | Se agotó la cuota del LLM y respondió el Mock: sigue mostrando tarjetas y reservas |
| "No quedan cupos" | Elegir otra fecha o experiencia; o borrar reservas de prueba (ver arriba) |
| Se reinició `npm run demo` | Usar el nuevo `demo/qr-ecoruta.png` o leer la dirección en `demo/url.txt` |

## Al terminar
Cerrar `npm run demo` con **Ctrl + C**: mientras está abierto, Ecoruta es
pública y los pagos simulados permiten confirmar reservas sin pagar.
