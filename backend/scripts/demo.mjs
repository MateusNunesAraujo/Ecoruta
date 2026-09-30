// Publica Ecoruta en internet para la demo, desde este portátil.
// Uso (dentro de backend/):  npm run demo      · Para apagar: Ctrl + C
//
// 1. Levanta PostgreSQL (Docker).
// 2. Abre un túnel de Cloudflare (gratis, sin cuenta ni dominio) y lee la
//    dirección pública https://<algo>.trycloudflare.com.
// 3. Compila y arranca el backend (o reutiliza uno que ya esté corriendo).
// 4. Comprueba que la dirección pública responde.
// 5. Genera el código QR: en la terminal y en demo/qr-ecoruta.png.
//
// Ojo: la dirección cambia cada vez que se ejecuta. Si se reinicia, hay que
// usar el QR nuevo. El portátil debe seguir encendido y con internet.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import QRCode from 'qrcode';

const RAIZ = resolve(process.cwd(), '..');
const CARPETA_DEMO = resolve(RAIZ, 'demo');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const procesos = [];

// Lee una variable del .env de la raíz (sin librerías).
function variableEnv(nombre, porDefecto) {
  const ruta = resolve(RAIZ, '.env');
  if (!existsSync(ruta)) return porDefecto;
  const linea = readFileSync(ruta, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${nombre}=`));
  const valor = linea?.slice(nombre.length + 1).trim();
  return valor || porDefecto;
}

const PORT = process.env.PORT ?? variableEnv('PORT', '3000');
const LOCAL = `http://localhost:${PORT}`;

async function responde(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}

function apagar(codigo = 0) {
  for (const p of procesos) p.kill();
  process.exit(codigo);
}
process.on('SIGINT', () => {
  console.log('\nApagando el túnel y el backend…');
  apagar(0);
});

function fallar(mensaje) {
  console.error(`\n✗ ${mensaje}`);
  apagar(1);
}

// --- 1. Base de datos ---
console.log('1/5 Levantando PostgreSQL (Docker)…');
const docker = spawnSync('docker', ['compose', 'up', '-d'], { cwd: RAIZ, stdio: 'pipe' });
if (docker.status !== 0) {
  fallar('Docker no responde. Abre Docker Desktop y vuelve a intentarlo.');
}

// --- 2. Túnel ---
console.log('2/5 Abriendo el túnel de Cloudflare…');
if (spawnSync('cloudflared', ['--version'], { stdio: 'ignore' }).error) {
  fallar(
    'No está instalado cloudflared. En PowerShell:\n' +
      '    winget install --id Cloudflare.cloudflared\n' +
      '  y abre una terminal nueva.',
  );
}
const tunel = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', LOCAL]);
procesos.push(tunel);
const URL_PUBLICA = await new Promise((resolver) => {
  const limite = setTimeout(() => resolver(null), 45_000);
  // cloudflared escribe la dirección en su salida de errores.
  const leer = (datos) => {
    const encontrada = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(datos));
    if (encontrada) {
      clearTimeout(limite);
      resolver(encontrada[0]);
    }
  };
  tunel.stderr.on('data', leer);
  tunel.stdout.on('data', leer);
});
if (!URL_PUBLICA) fallar('Cloudflare no entregó una dirección. ¿Hay internet?');

// --- 3. Backend ---
if (await responde(`${LOCAL}/api`)) {
  console.log(`3/5 Ya hay un backend en ${LOCAL}: se usa ese.`);
} else {
  console.log('3/5 Compilando y arrancando el backend…');
  const build = spawnSync('npm', ['run', 'build'], { shell: true, stdio: 'inherit' });
  if (build.status !== 0) fallar('No compiló el backend.');
  // URL_PUBLICA: a ella vuelve el turista después de pagar en Wompi real.
  const backend = spawn('node', ['dist/main.js'], {
    env: { ...process.env, PORT, URL_PUBLICA },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  procesos.push(backend);
  let listo = false;
  for (let i = 0; i < 60 && !listo; i++) {
    await esperar(1000);
    listo = await responde(`${LOCAL}/api`);
  }
  if (!listo) fallar('El backend no arrancó (revisa los mensajes de arriba).');
}

// --- 4. Comprobar desde internet ---
console.log('4/5 Comprobando la dirección pública…');
let publica = false;
for (let i = 0; i < 30 && !publica; i++) {
  publica = await responde(`${URL_PUBLICA}/api/experiencias`);
  if (!publica) await esperar(2000);
}
if (!publica) {
  console.warn('   ⚠ Aún no responde desde internet (a veces tarda un minuto).');
}

// --- 5. Código QR ---
console.log('5/5 Generando el código QR…');
mkdirSync(CARPETA_DEMO, { recursive: true });
const archivoQr = resolve(CARPETA_DEMO, 'qr-ecoruta.png');
await QRCode.toFile(archivoQr, URL_PUBLICA, { width: 600, margin: 2 });
writeFileSync(resolve(CARPETA_DEMO, 'url.txt'), `${URL_PUBLICA}\n`);
console.log(await QRCode.toString(URL_PUBLICA, { type: 'terminal', small: true }));

const pagos = await fetch(`${LOCAL}/api/pagos/config`)
  .then((r) => r.json())
  .catch(() => ({}));
console.log('══════════════════════════════════════════════════════════');
console.log(`  Ecoruta está en:  ${URL_PUBLICA}`);
console.log(`  Código QR:        ${archivoQr}`);
console.log(`  Asistente:        LLM_PROVIDER=${variableEnv('LLM_PROVIDER', 'mock')}`);
console.log(
  `  Pagos:            ${pagos.simulado ? 'SIMULADOS (decirlo en la demo)' : pagos.habilitado ? 'Wompi' : 'desactivados'}`,
);
console.log('  Deja esta ventana abierta. Para apagar: Ctrl + C');
console.log('══════════════════════════════════════════════════════════');
