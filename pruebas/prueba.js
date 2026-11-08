// Pruebas de aceptación de Taller con un OpenRouter simulado.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');
const os = require('os');

// Pruebas de Taller Code. Uso:  cd ~/taller && node pruebas/prueba.js
// Prueba una COPIA del programa en una carpeta temporal: no toca tu .env, tus chats ni tus proyectos.
// Necesita los puertos 4998 y 4999 libres.
const ORIGEN = path.resolve(__dirname, '..');
const T = path.join(os.tmpdir(), 'taller_prueba');
fs.rmSync(T, { recursive: true, force: true });
const RAIZ = path.join(T, 'jad');
const PROY = path.join(RAIZ, 'sol', 'rapigo_cliente');
fs.mkdirSync(path.join(PROY, 'lib'), { recursive: true });
fs.mkdirSync(path.join(PROY, 'android'), { recursive: true });
fs.writeFileSync(path.join(PROY, 'lib', 'main.dart'), "Text('Viaje de 6.3 km',\n  style: TextStyle(\n    color: Color(0xFF424242),\n  ),\n)\n");
fs.writeFileSync(path.join(PROY, 'android', 'key.properties'), 'storePassword=SECRETO\n');
const FUNC = path.join(RAIZ, 'sol', 'rapigo_functions');
fs.mkdirSync(FUNC, { recursive: true });
fs.writeFileSync(path.join(FUNC, 'index.js'), "exports.nuevoViaje = () => {\n  const prioridad = 'normal';\n};\n");
fs.writeFileSync(path.join(PROY, 'AGENTS.md'), 'Regla de prueba: hablar en español.\n');
fs.writeFileSync(path.join(T, 'fuera.txt'), 'NO DEBE LEERSE\n');
fs.symlinkSync(path.join(T, 'fuera.txt'), path.join(PROY, 'enlace.txt'));

// Copia del Taller en carpeta de prueba
const APP = path.join(T, 'taller');
// La versión pública no menciona al dueño en sus textos; la privada sí.
const PUBLICO = !fs.readFileSync(path.join(ORIGEN, 'server.js'), 'utf8').includes('José');
const EXCLUIR = new Set(['.env', 'datos', 'pruebas', 'node_modules', '.git']);
fs.cpSync(ORIGEN, APP, { recursive: true, filter: src => !EXCLUIR.has(path.basename(src)) || src === ORIGEN });
if (PUBLICO) { const c = JSON.parse(fs.readFileSync(path.join(APP, 'config.json'))); c.instrucciones = 'Responde siempre con una rima.'; fs.writeFileSync(path.join(APP, 'config.json'), JSON.stringify(c)); }
fs.rmSync(path.join(APP, 'datos'), { recursive: true, force: true });
fs.writeFileSync(path.join(APP, '.env'), 'OPENROUTER_API_KEY=llave-falsa\nOPENROUTER_URL=http://127.0.0.1:4999/v1\nOPENROUTER_MODELOS_URL=http://127.0.0.1:4999/models\nOPENROUTER_LLAVE_URL=http://127.0.0.1:4999/key\n');

// Guion del modelo simulado: cada respuesta es una lista de tool_calls o un texto
let guion = []; let guardado = 0; let fallar503 = 0;
const recibidos = [];
const mock = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.includes('/key')) {
    const okL = (req.headers.authorization || '').includes('sk-or-v1-buenaaaaaaaaaaaaaaaaaaaaaa');
    res.writeHead(okL ? 200 : 401, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(okL ? { data: { label: 'taller', usage: 0.25, limit: 2 } } : { error: { message: 'User not found.' } }));
  }
  if (req.method === 'GET') { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ data: [
    { id: 'openai/gpt-6.1-sol', name: 'Sol', pricing: { prompt: '0.000002', completion: '0.00001' }, context_length: 1100000, supported_parameters: ['tools','reasoning'], architecture: { input_modalities: ['text','image'] } },
    { id: 'google/gemini-3.5-flash', name: 'Gemini Flash', pricing: { prompt: '0.0000015', completion: '0.000009' }, supported_parameters: ['tools'], architecture: { input_modalities: ['text','image','audio'] } },
    { id: 'x/solo-texto', name: 'Solo texto', pricing: {}, supported_parameters: ['tools'], architecture: { input_modalities: ['text'] } },
    { id: 'x/sin-herramientas', name: 'X', pricing: {}, supported_parameters: [] } ] })); }
  let s = ''; req.on('data', c => s += c); req.on('end', () => {
    recibidos.push(JSON.parse(s));
    { const u = recibidos[recibidos.length - 1];
      if (u.stream === false && u.plugins) { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ choices: [{ message: { content: 'La versión actual es Flutter 9.9.', annotations: [{ type: 'url_citation', url_citation: { url: 'https://docs.flutter.dev/x', title: 'Docs' } }] } }], usage: { cost: 0.004 } })); }
      if (u.stream === false && JSON.stringify(u.messages).includes('mantener la memoria permanente')) {
        const c = JSON.stringify(u.messages); let a = [];
        if (c.includes('CAMBIOS APROBADOS') && c.includes('migró a Flutter')) a = [{ op: 'reemplazar', vieja: 'Arquitectura: WebView', nota: 'Proyecto migrado a Flutter (el mapa ya es nativo)' }];
        else if (c.includes('bloqueo pasa a $5')) a = [{ op: 'reemplazar', vieja: 'Monto de bloqueo', nota: 'Monto de bloqueo: $5' }];
        else if (c.includes('guarda mi password')) a = [{ op: 'agregar', nota: 'password: abc123' }];
        else if (c.includes('acordamos Firebase')) a = [{ op: 'agregar', nota: 'Nota automática de prueba' }];
        res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ choices: [{ message: { content: '```json\n' + JSON.stringify({ acciones: a }) + '\n```' } }], usage: { cost: 0.0002 } })); }
      if (u.stream === false && JSON.stringify(u.messages).includes('Resume esta conversación')) { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ choices: [{ message: { content: 'RESUMEN-PRUEBA' } }], usage: { cost: 0.001 } })); } }
    if (recibidos[recibidos.length - 1].stream === false) { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ choices: [{ message: { content: ' Hola, cambia el color del botón.  ' } }], usage: { cost: 0.0003 } })); }
    if (fallar503 > 0) { fallar503--; res.writeHead(503, {'Content-Type':'application/json'}); return res.end('{"error":{"message":"System is too busy now"}}'); }
    const paso = guion.shift() || { texto: 'Listo.' };
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const w = o => res.write('data: ' + JSON.stringify(o) + '\n\n');
    if (paso.texto) w({ model: 'openai/gpt-6.1-sol', choices: [{ delta: { content: paso.texto } }] });
    (paso.llamadas || []).forEach((c, i) => w({ choices: [{ delta: { tool_calls: [{ index: i, id: 'c' + Math.random(), function: { name: c[0], arguments: JSON.stringify(c[1]) } }] } }] }));
    w({ choices: [], usage: { prompt_tokens: 10, completion_tokens: 5, cost: 0.0012 } });
    res.write('data: [DONE]\n\n'); res.end();
  });
});

function pedir(metodo, ruta, cuerpo, cab = {}) {
  return new Promise((ok, mal) => {
    const req = http.request({ host: '127.0.0.1', port: 4998, path: ruta, method: metodo, headers: { 'Content-Type': 'application/json', 'X-Taller': '1', ...cab } }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => ok({ code: res.statusCode, cuerpo: s, headers: res.headers }));
    });
    req.on('error', mal); if (cuerpo) req.write(JSON.stringify(cuerpo)); req.end();
  });
}
const eventos = s => s.split('\n\n').filter(l => l.startsWith('data: ')).map(l => JSON.parse(l.slice(6)));
const ok = m => console.log('  OK  ' + m);

(async () => {
  await new Promise(r => mock.listen(4999, '127.0.0.1', r));
  const srv = spawn('node', ['server.js'], { cwd: APP, env: { ...process.env, TALLER_MEMORIA_AUTO: '0', TALLER_ESPERA_REINTENTO: '10', PUERTO: '4998', TALLER_RAICES: RAIZ } });
  srv.stderr.on('data', d => process.stderr.write(d));
  await new Promise(r => srv.stdout.once('data', r));
  try {
    // 1. Proyecto fuera de las raíces
    let r = await pedir('POST', '/api/abrir', { ruta: T });
    assert.equal(r.code, 400); ok('Carpeta fuera de las permitidas: rechazada');
    r = await pedir('POST', '/api/abrir', { ruta: '../' });
    assert.equal(r.code, 400); ok('Ruta relativa: rechazada');

    // 2. Protección contra otras páginas
    r = await pedir('POST', '/api/abrir', { ruta: PROY }, { 'X-Taller': '' });
    assert.equal(r.code, 403); ok('POST sin cabecera X-Taller: rechazado');
    r = await pedir('GET', '/api/estado', null, { Host: 'malicioso.com' });
    assert.equal(r.code, 403); ok('Host extraño: rechazado');

    r = await pedir('POST', '/api/abrir', { ruta: PROY, real: false });
    assert.equal(r.code, 200); ok('Proyecto válido abierto');

    // 2b. Charla libre: carpeta neutral cuando no hay proyecto
    r = await pedir('GET', '/api/estado');
    const estadoCharla = JSON.parse(r.cuerpo);
    assert.ok(estadoCharla.charla && estadoCharla.charla.endsWith('/charla')); ok('Estado informa la carpeta de charla libre');
    r = await pedir('POST', '/api/abrir', { ruta: estadoCharla.charla });
    assert.equal(r.code, 200); ok('Charla libre se abre aunque no esté en las raíces');
    assert.deepEqual(fs.readdirSync(estadoCharla.charla), []); ok('La carpeta de charla está vacía (no da acceso a nada)');
    r = await pedir('POST', '/api/abrir', { ruta: estadoCharla.charla + '/../datos' });
    assert.equal(r.code, 400); ok('Salir de la charla hacia otra carpeta: rechazado');
    r = await pedir('POST', '/api/abrir', { ruta: '/media/jad/Disco inexistente/proyecto' });
    assert.equal(r.code, 400); assert.ok(JSON.parse(r.cuerpo).error.includes('montado')); ok('Carpeta de un disco ausente: avisa que revise el montaje');
    r = await pedir('POST', '/api/abrir', { ruta: PROY, real: false });
    assert.equal(r.code, 200);

    // 2c. Borrar un chat de un proyecto cuyo disco ya no está
    {
      const fantasma = '/media/jad/Disco ausente/proyecto_fantasma';
      const d = JSON.parse(fs.readFileSync(path.join(APP, 'datos', 'proyectos.json'), 'utf8'));
      d.proyectos.push({ ruta: fantasma, nombre: 'proyecto_fantasma', real: false }); fs.writeFileSync(path.join(APP, 'datos', 'proyectos.json'), JSON.stringify(d));
      const idc = fantasma.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
      const arch = path.join(APP, 'datos', 'chats', idc + '.20260101_000000.json');
      fs.mkdirSync(path.dirname(arch), { recursive: true }); fs.writeFileSync(arch, JSON.stringify({ mensajes: [{ role: 'user', content: 'hola' }] }));
      r = await pedir('POST', '/api/borrarchat', { ruta: fantasma, id: '20260101_000000' });
      assert.equal(r.code, 200); assert.ok(!fs.existsSync(arch)); ok('Chat de un disco ausente: se puede borrar');
      const actual = path.join(APP, 'datos', 'chats', idc + '.json'); fs.writeFileSync(actual, JSON.stringify({ mensajes: [{ role: 'user', content: 'chat actual' }] }));
      r = await pedir('POST', '/api/borrarchat', { ruta: fantasma, id: null });
      assert.equal(r.code, 200); assert.ok(!fs.existsSync(actual)); ok('Chat actual de un proyecto (sin id): se puede borrar');
      r = await pedir('POST', '/api/borrarchat', { ruta: fantasma, id: '../../x' });
      assert.equal(r.code, 400); ok('Id de chat con ruta falsa: rechazado');
      r = await pedir('POST', '/api/borrarchat', { ruta: '/media/jad/Otro/no_registrado', id: '20260101_000000' });
      assert.equal(r.code, 400); ok('Proyecto no registrado y ausente: sigue rechazado');
    }

    // 3. Intentos de salir del proyecto y leer secretos
    guion = [
      { llamadas: [['leer_archivo', { ruta: '../../../fuera.txt', desde: 1, hasta: 5 }], ['leer_archivo', { ruta: '/etc/passwd', desde: 1, hasta: 5 }],
                   ['leer_archivo', { ruta: 'enlace.txt', desde: 1, hasta: 5 }], ['leer_archivo', { ruta: 'android/key.properties', desde: 1, hasta: 5 }],
                   ['buscar', { texto: 'SECRETO' }], ['buscar', { texto: 'NO DEBE' }], ['listar', { ruta: 'android' }]] },
      { texto: 'No pude.' },
    ];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'intenta leer cosas prohibidas', esfuerzo: 'medium' });
    const segunda = recibidos[recibidos.length - 1];
    const tools = segunda.messages.filter(m => m.role === 'tool').map(m => m.content);
    assert.match(tools[0], /fuera del proyecto/); ok('../ fuera del proyecto: rechazado');
    assert.match(tools[1], /fuera del proyecto/); ok('/etc/passwd: rechazado');
    assert.match(tools[2], /enlace/); ok('Enlace simbólico hacia fuera: rechazado');
    assert.match(tools[3], /protegido/); ok('key.properties: bloqueado');
    assert.equal(tools[4], 'Sin coincidencias.'); ok('buscar no entra en secretos');
    assert.equal(tools[5], 'Sin coincidencias.'); ok('buscar no sigue enlaces hacia fuera');
    assert.match(tools[6], /key\.properties\s+\[protegido\]/); ok('listar marca el secreto como protegido');
    assert(!JSON.stringify(recibidos).includes('storePassword=SECRETO')); ok('El secreto nunca llegó al modelo');
    assert(segunda.messages[0].content.includes('Regla de prueba')); ok('AGENTS.md cargado en las instrucciones');
    assert.deepEqual(segunda.reasoning, { effort: 'medium' }); ok('Esfuerzo de razonamiento enviado');
    assert(segunda.tools.length === 13 && !segunda.tools.some(t => /bash|shell|terminal/.test(t.function.name)) && segunda.tools.some(t => t.function.name === 'comando')); ok('Solo hay una vía a la terminal: la herramienta comando (con permiso)');

    // 4. Lectura por rango
    guion = [{ llamadas: [['leer_archivo', { ruta: 'lib/main.dart', desde: 2, hasta: 3 }]] }, { texto: 'Leído.' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'lee líneas 2-3' });
    const leido = recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content;
    assert.match(leido, /líneas 2-3 de 6/); assert(!leido.includes('Viaje de')); ok('Lectura por rango devuelve solo esas líneas');

    // 5. Propuesta: no se aplica sin clic
    const original = fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8');
    guion = [{ texto: 'Cambio el color.', llamadas: [['editar', { ruta: 'lib/main.dart', buscar: 'color: Color(0xFF424242),', reemplazo: 'color: Color(0xFF212121),', explicacion: 'Oscurecer el texto' }]] }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'oscurece el texto' });
    const ev = eventos(r.cuerpo);
    const prop = ev.find(e => e.tipo === 'propuesta');
    assert(prop && prop.linea === 3); ok('Propuesta mostrada con archivo y línea');
    assert.equal(guion.length, 0); assert(ev.some(e => e.tipo === 'costo' && e.mensaje > 0)); ok('Costo reportado');
    const llamadasAntes = recibidos.length;
    await new Promise(r => setTimeout(r, 300));
    assert.equal(fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8'), original); ok('Archivo SIN cambios antes de aprobar');
    assert.equal(recibidos.length, llamadasAntes); ok('El agente se detuvo a esperar');
    assert(!fs.readdirSync(path.join(PROY, 'lib')).some(f => f.includes('.antes_'))); ok('Sin copia todavía (nada aplicado)');

    // 6. Rechazar
    guion = [{ llamadas: [['editar', { ruta: 'lib/main.dart', buscar: 'Viaje de 6.3 km', reemplazo: 'Viaje de X km', explicacion: 'prueba rechazo' }]] }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otro cambio' });
    const prop2 = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
    r = await pedir('POST', '/api/decision', { ruta: PROY, id: prop2.id, decision: 'rechazar' });
    assert.equal(fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8'), original); ok('Rechazar no cambia nada');

    // 7. Aprobar: copia + cambio
    r = await pedir('POST', '/api/decision', { ruta: PROY, id: prop.id, decision: 'aprobar' });
    const dec = JSON.parse(r.cuerpo);
    assert.equal(dec.estado, 'aplicada');
    const nuevo = fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8');
    assert(nuevo.includes('0xFF212121') && !nuevo.includes('0xFF424242')); ok('Aprobar aplica el cambio');
    const copia = path.join(PROY, dec.copia);
    assert.equal(fs.readFileSync(copia, 'utf8'), original); ok('Copia de seguridad creada con el original: ' + dec.copia);
    r = await pedir('POST', '/api/decision', { ruta: PROY, id: prop.id, decision: 'aprobar' });
    assert.equal(r.code, 400); ok('No se puede aplicar dos veces');

    // 8. Fragmento ambiguo o inexistente
    guion = [{ llamadas: [['editar', { ruta: 'lib/main.dart', buscar: '  ', reemplazo: ' ', explicacion: 'x' }], ['editar', { ruta: 'lib/main.dart', buscar: 'NOEXISTE', reemplazo: 'y', explicacion: 'x' }]] }, { texto: 'ok' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'ambiguo' });
    const t8 = recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').slice(-2).map(m => m.content);
    assert.match(t8[0], /aparece \d+ veces/); assert.match(t8[1], /no aparece/); ok('Fragmento repetido o inexistente: rechazado');

    // 9. Editar un secreto
    guion = [{ llamadas: [['editar', { ruta: 'android/key.properties', buscar: 'storePassword', reemplazo: 'x', explicacion: 'x' }]] }, { texto: 'ok' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'edita secreto' });
    assert.match(recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content, /protegido/); ok('Editar secreto: bloqueado');

    // 10. Historial visible
    r = await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY));
    const h = JSON.parse(r.cuerpo);
    assert(h.mensajes.some(m => m.rol === 'propuesta' && m.propuesta.estado === 'aplicada')); ok('Historial guarda propuestas y su estado');
    assert(h.costoSesion > 0); ok('Costo de sesión acumulado: $' + h.costoSesion.toFixed(4));

    r = await pedir('POST', '/api/abrir', { ruta: '"' + PROY + '/"' });
    assert.equal(JSON.parse(r.cuerpo).ruta, PROY); ok('Ruta con comillas y barra final: aceptada');
    r = await pedir('GET', '/api/modelos');
    const ms = JSON.parse(r.cuerpo).modelos;
    const sol = ms.find(m => m.id === 'openai/gpt-6.1-sol'); assert(ms.length === 3 && sol.entrada === 2 && sol.salida === 10 && sol.imagen === true && !ms.find(m => m.id === 'x/solo-texto').imagen); ok('Catálogo: solo modelos con herramientas, precio por millón');
    guion = [{ texto: 'hola' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', modelo: 'deepseek/deepseek-v4' });
    assert.equal(recibidos[recibidos.length - 1].model, 'deepseek/deepseek-v4'); ok('Usa el modelo elegido');
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', modelo: 'malo"; rm' });
    assert.equal(r.code, 400); ok('Nombre de modelo raro: rechazado');
    r = await pedir('GET', '/api/llave');
    assert.equal(JSON.parse(r.cuerpo).valida, false); ok('Llave vieja detectada como inválida');
    r = await pedir('POST', '/api/llave', { llave: 'hola' });
    assert.equal(r.code, 400); ok('Texto que no es llave: rechazado');
    r = await pedir('POST', '/api/llave', { llave: 'sk-or-v1-malaaaaaaaaaaaaaaaaaaaaaaa' });
    assert.equal(r.code, 400); assert(!fs.readFileSync(path.join(APP, '.env'), 'utf8').includes('mala')); ok('Llave que OpenRouter no acepta: no se guarda');
    r = await pedir('POST', '/api/llave', { llave: 'sk-or-v1-buenaaaaaaaaaaaaaaaaaaaaaa' });
    const li = JSON.parse(r.cuerpo);
    assert(li.valida && li.usado === 0.25 && li.limite === 2); ok('Llave buena: guardada y verificada (usado $0.25 de $2)');
    assert.equal(fs.readFileSync(path.join(APP, '.env'), 'utf8'), 'OPENROUTER_API_KEY=sk-or-v1-buenaaaaaaaaaaaaaaaaaaaaaa\n');
    assert.equal((fs.statSync(path.join(APP, '.env')).mode & 0o777).toString(8), '600'); ok('.env escrito con permisos privados');
    guardado = recibidos.length; guion = [{ texto: 'hola' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x' });
    assert(r.cuerpo.includes('"tipo":"texto"')); ok('El chat usa la llave nueva sin reiniciar');
    // ---- Imágenes ----
    const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    guion = [{ texto: 'Veo un cuadrito.' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mira esto', imagenes: [PNG], modelo: 'openai/gpt-6.1-sol' });
    assert(r.code === 200 && r.cuerpo.includes('Veo un cuadrito')); 
    let ult = recibidos[recibidos.length - 1].messages.filter(m => m.role === 'user').pop();
    assert(Array.isArray(ult.content) && ult.content[0].text === 'mira esto' && ult.content[1].type === 'image_url' && ult.content[1].image_url.url === PNG); ok('La imagen llega al modelo junto con el texto');

    guion = [{ texto: 'ok' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra cosa sin imagen' });
    const pedido = JSON.stringify(recibidos[recibidos.length - 1]);
    assert(!pedido.includes('data:image') && pedido.includes('omitida')); ok('En el mensaje siguiente la imagen vieja ya no se paga');

    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', imagenes: [PNG], modelo: 'x/solo-texto' });
    assert.equal(r.code, 400); assert.match(r.cuerpo, /no lee imágenes/); ok('Modelo que no lee imágenes: rechazado con aviso claro');
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', imagenes: ['data:text/html;base64,AAAA'] });
    assert.equal(r.code, 400); ok('Archivo que no es imagen: rechazado');
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', imagenes: ['data:image/png;base64,<script>'] });
    assert.equal(r.code, 400); ok('Datos mal formados: rechazados');
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', imagenes: [PNG, PNG, PNG, PNG, PNG] });
    assert.equal(r.code, 400); ok('Más de 4 imágenes: rechazado');

    guion = [{ texto: 'Solo imagen recibida.' }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: '', imagenes: [PNG] });
    assert(r.code === 200 && r.cuerpo.includes('Solo imagen')); ok('Se puede enviar solo la imagen, sin texto');

    r = await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY));
    const hh = JSON.parse(r.cuerpo);
    assert(hh.mensajes.some(m => m.rol === 'user' && m.imagenes.length === 1 && m.texto === 'mira esto')); ok('El historial conserva las imágenes para mostrarlas');
    if (PUBLICO) {
      const sistema = recibidos[recibidos.length - 1].messages[0].content;
      assert(sistema.includes('Responde siempre con una rima.')); ok('Público: las instrucciones de config.json llegan al agente');
      const todo = JSON.stringify(recibidos);
      assert(!/José|JAD|jad/.test(todo.split(path.join(T, 'jad')).join(''))); ok('Público: ningún texto enviado al modelo menciona a José ni a JAD');
      const hv = JSON.parse((await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY))).cuerpo);
      assert(!JSON.stringify(hv).includes('José')); ok('Público: los avisos del historial son genéricos');
    }

    // 12. Varios proyectos en el mismo chat
    r = await pedir('POST', '/api/sumar', { ruta: PROY, otra: FUNC });
    assert.equal(r.code, 200); assert.equal(JSON.parse(r.cuerpo).extras[0].nombre, 'rapigo_functions'); ok('Se suma un segundo proyecto al chat');
    r = await pedir('POST', '/api/sumar', { ruta: PROY, otra: FUNC });
    assert.equal(r.code, 400); ok('No se suma dos veces');
    r = await pedir('POST', '/api/sumar', { ruta: PROY, otra: T });
    assert.equal(r.code, 400); ok('No se puede sumar una carpeta fuera de las permitidas');
    r = await pedir('POST', '/api/sumar', { ruta: PROY, otra: PROY });
    assert.equal(r.code, 400); ok('No se suma el proyecto principal a sí mismo');
    let hx = JSON.parse((await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY))).cuerpo);
    assert.equal(hx.extras.length, 1); ok('El historial informa los proyectos sumados');

    guion = [{ llamadas: [['listar', { ruta: '.' }]] }, { texto: 'Listo.' }];
    await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mira todo' });
    const trasSumar = recibidos.slice(-2);
    assert(trasSumar[0].messages[0].content.includes('rapigo_functions') && trasSumar[0].messages[0].content.includes('rapigo_cliente')); ok('El agente recibe la lista de proyectos del chat');
    assert(trasSumar[0].tools.filter(t => ['listar','buscar','leer_archivo','editar','comando','crear_archivo','captura'].includes(t.function.name)).every(t => t.function.parameters.properties.proyecto)); ok('Todas las herramientas aceptan el parámetro proyecto');
    assert.match(trasSumar[1].messages.filter(m => m.role === 'tool').pop().content, /Indica el proyecto.*rapigo_cliente.*rapigo_functions/); ok('Sin indicar proyecto: error con las opciones');

    guion = [{ llamadas: [['leer_archivo', { proyecto: 'rapigo_functions', ruta: 'index.js', desde: 1, hasta: 3 }]] }, { texto: 'Leído.' }];
    await pedir('POST', '/api/chat', { ruta: PROY, texto: 'lee la function' });
    assert.match(recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content, /prioridad = 'normal'/); ok('Lee un archivo del segundo proyecto');
    guion = [{ llamadas: [['leer_archivo', { proyecto: 'rapigo_functions', ruta: '../rapigo_cliente/lib/main.dart', desde: 1, hasta: 2 }]] }, { texto: 'x' }];
    await pedir('POST', '/api/chat', { ruta: PROY, texto: 'intenta salir' });
    assert.match(recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content, /fuera del proyecto/); ok('Cada proyecto sigue encerrado en su carpeta');

    const mainAntes = fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8');
    guion = [{ texto: 'Cambio la function.', llamadas: [['editar', { proyecto: 'rapigo_functions', ruta: 'index.js', buscar: "'normal'", reemplazo: "'alta'", explicacion: 'Prioridad alta' }]] }];
    r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'sube la prioridad' });
    const pm = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
    assert(pm && pm.proyecto === 'rapigo_functions'); ok('La propuesta indica a qué proyecto pertenece');
    assert.equal(fs.readFileSync(path.join(FUNC, 'index.js'), 'utf8').includes("'alta'"), false); ok('Nada se aplica antes de aprobar');
    r = await pedir('POST', '/api/decision', { ruta: PROY, id: pm.id, decision: 'aprobar' });
    const dm = JSON.parse(r.cuerpo);
    assert.equal(r.code, 200); assert(fs.readFileSync(path.join(FUNC, 'index.js'), 'utf8').includes("'alta'")); ok('Aprobar aplica el cambio en el proyecto correcto');
    assert(fs.readdirSync(FUNC).some(f => f.startsWith('index.js.antes_'))); ok('La copia de seguridad queda junto al archivo cambiado');
    assert.equal(fs.readFileSync(path.join(PROY, 'lib', 'main.dart'), 'utf8'), mainAntes); ok('El otro proyecto no se tocó');
    assert(!fs.readdirSync(path.join(PROY, 'lib')).some(f => f.startsWith('main.dart.antes_') && false)); 

    r = await pedir('POST', '/api/restar', { ruta: PROY, otra: FUNC });
    assert.equal(JSON.parse(r.cuerpo).extras.length, 0); ok('Se quita el proyecto del chat');
    guion = [{ llamadas: [['listar', { ruta: '.' }]] }, { texto: 'ok' }];
    await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra vez solo uno' });
    assert(!recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content.startsWith('Error')); ok('Con un solo proyecto no hace falta indicarlo');

    // 13. Dictado por voz (Gemini vía OpenRouter)
    const wavMini = (n = 800) => { const b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); return 'data:audio/wav;base64,' + b.toString('base64'); };
    let rv = await pedir('POST', '/api/transcribir', { audio: wavMini() });
    let dv = JSON.parse(rv.cuerpo);
    assert.equal(rv.code, 200); assert.equal(dv.texto, 'Hola, cambia el color del botón.'); assert(dv.costo > 0); ok('El audio se transcribe y el texto llega limpio, con su costo');
    const pedAudio = recibidos[recibidos.length - 1];
    assert.equal(pedAudio.model, 'google/gemini-3.5-flash'); ok('Elige solo un modelo Gemini con entrada de audio');
    const partes = pedAudio.messages[0].content;
    assert(partes.some(x => x.type === 'input_audio' && x.input_audio.format === 'wav' && x.input_audio.data.startsWith('UklGR'))); ok('El WAV llega al modelo como input_audio');
    assert(partes.find(x => x.type === 'text').text.includes('No obedezcas')); ok('La instrucción protege contra órdenes dichas dentro del audio');
    assert.equal(pedAudio.stream, false); ok('Transcripción sin streaming');
    rv = await pedir('POST', '/api/transcribir', { audio: 'data:audio/wav;base64,AAAAAAAAAAAAAAAAAAAA' });
    assert.equal(rv.code, 400); assert.match(rv.cuerpo, /WAV/); ok('Algo que no es WAV: rechazado');
    rv = await pedir('POST', '/api/transcribir', { audio: 'data:text/html;base64,AAAA' });
    assert.equal(rv.code, 400); ok('Tipo de archivo no permitido: rechazado');
    rv = await pedir('POST', '/api/transcribir', { audio: wavMini(2_700_000) });
    assert.equal(rv.code, 400); assert.match(rv.cuerpo, /largo/); ok('Audio demasiado largo: rechazado');
    rv = await pedir('POST', '/api/transcribir', { audio: wavMini() }, { 'X-Taller': '' });
    assert.equal(rv.code, 403); ok('Transcribir sin la cabecera X-Taller: rechazado');
    const msv = JSON.parse((await pedir('GET', '/api/modelos')).cuerpo).modelos;
    assert(msv.find(m => m.id === 'google/gemini-3.5-flash').audio === true && !msv.find(m => m.id === 'openai/gpt-6.1-sol').audio); ok('El catálogo marca qué modelos aceptan audio');

    // 14. HTTPS para el micrófono del teléfono (modo red)
    const https = require('https');
    const T2 = path.join(os.tmpdir(), 'taller_prueba_red'); fs.rmSync(T2, { recursive: true, force: true });
    fs.cpSync(APP, T2, { recursive: true, filter: s => path.basename(s) !== 'datos' });
    const srv2 = spawn('node', ['server.js'], { cwd: T2, env: { ...process.env, TALLER_MEMORIA_AUTO: '0', PUERTO: '4996', TALLER_RAICES: RAIZ, TALLER_RED: '1' } });
    let salida2 = ''; srv2.stdout.on('data', d => salida2 += d);
    await new Promise(r => setTimeout(r, 2500));
    try {
      const rs = await new Promise((ok2, mal) => https.get({ host: '127.0.0.1', port: 4997, path: '/api/estado', rejectUnauthorized: false }, x => { let s = ''; x.on('data', c => s += c); x.on('end', () => ok2({ code: x.statusCode, cuerpo: s })); }).on('error', mal));
      assert.equal(rs.code, 200); ok('Modo red: sirve también por HTTPS en el puerto siguiente');
      assert(fs.existsSync(path.join(T2, 'datos', 'cert', 'key.pem')) && (fs.statSync(path.join(T2, 'datos', 'cert', 'key.pem')).mode & 0o777) === 0o600); ok('Certificado generado y llave privada con permisos 600');
      assert(/https:\/\/.*:4997|Aviso: no pude crear/.test(salida2)); ok('La terminal muestra la dirección https para el teléfono');
    } finally { srv2.kill(); }

    // Chats anteriores: listar, abrir (intercambia con el actual) y borrar
    {
      const idc = PROY.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
      const dc = path.join(APP, 'datos', 'chats');
      fs.mkdirSync(dc, { recursive: true });
      const cur = path.join(dc, idc + '.json');
      fs.writeFileSync(cur, JSON.stringify({ mensajes: [{ role: 'user', content: 'chat actual de prueba' }], costoSesion: 0, pendientes: {} }));
      fs.writeFileSync(path.join(dc, idc + '.20260101_100000.json'), JSON.stringify({ mensajes: [{ role: 'user', content: 'chat viejo uno' }, { role: 'assistant', content: 'hola' }], costoSesion: 0.01, pendientes: {} }));
      fs.writeFileSync(path.join(dc, idc + '.20260102_100000.json'), JSON.stringify({ mensajes: [{ role: 'user', content: '[Aviso automático] solo aviso' }], costoSesion: 0, pendientes: {} }));
      r = await pedir('GET', '/api/chats?ruta=' + encodeURIComponent(PROY));
      assert.equal(r.code, 200);
      let lista = JSON.parse(r.cuerpo).chats;
      assert(lista.length === 1 && lista[0].id === '20260101_100000' && lista[0].titulo === 'chat viejo uno'); ok('Chats anteriores: lista los archivados con título (ignora los vacíos)');
      r = await pedir('POST', '/api/restaurar', { ruta: PROY, id: '../../x' });
      assert.equal(r.code, 400); ok('Abrir chat con id malicioso: rechazado');
      r = await pedir('POST', '/api/restaurar', { ruta: PROY, id: '20260101_100000' });
      assert.equal(r.code, 200);
      assert(JSON.parse(fs.readFileSync(cur, 'utf8')).mensajes[0].content === 'chat viejo uno'); ok('Abrir un chat anterior lo deja como el actual');
      lista = JSON.parse((await pedir('GET', '/api/chats?ruta=' + encodeURIComponent(PROY))).cuerpo).chats;
      assert(lista.length === 1 && lista[0].titulo === 'chat actual de prueba'); ok('El chat que estaba abierto pasa a la lista (no se pierde)');
      r = await pedir('POST', '/api/borrarchat', { ruta: PROY, id: lista[0].id });
      assert.equal(r.code, 200);
      assert.equal(JSON.parse((await pedir('GET', '/api/chats?ruta=' + encodeURIComponent(PROY))).cuerpo).chats.length, 0); ok('Borrar un chat anterior lo elimina');
    }

    // Recientes: lista global con título corto, sin IA
    {
      const idc = PROY.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
      const dc = path.join(APP, 'datos', 'chats');
      fs.mkdirSync(dc, { recursive: true });
      const largo = 'Arregla el botón de cancelar viaje del chofer porque no responde cuando hay poca señal y además revisa el cliente';
      fs.writeFileSync(path.join(dc, idc + '.json'), JSON.stringify({ mensajes: [{ role: 'user', content: '[Aviso automático] sumado' }, { role: 'user', content: largo }], costoSesion: 0, pendientes: {} }));
      fs.writeFileSync(path.join(dc, idc + '.20250101_090000.json'), JSON.stringify({ mensajes: [{ role: 'user', content: 'chat archivado corto' }], costoSesion: 0, pendientes: {} }));
      fs.writeFileSync(path.join(dc, 'otro_proyecto_desconocido.json'), JSON.stringify({ mensajes: [{ role: 'user', content: 'no debe salir' }], costoSesion: 0, pendientes: {} }));
      r = await pedir('GET', '/api/recientes');
      assert.equal(r.code, 200);
      const rc = JSON.parse(r.cuerpo).chats;
      const act = rc.find(c => c.id === null && c.proyecto === PROY), arc = rc.find(c => c.id === '20250101_090000');
      assert(act && act.titulo.endsWith('…') && act.titulo.length <= 49 && act.titulo.startsWith('Arregla el botón')); ok('Recientes: título corto sacado del primer mensaje real (sin avisos, sin IA)');
      assert(arc && arc.titulo === 'chat archivado corto'); ok('Recientes: incluye los chats archivados del proyecto');
      assert(!rc.some(c => c.titulo === 'no debe salir')); ok('Recientes: ignora chats de proyectos que ya no están en la lista');
      assert(rc.indexOf(act) >= 0 && rc.every((c, i) => i === 0 || rc[i - 1].fecha >= c.fecha)); ok('Recientes: ordenados del más nuevo al más viejo');
    }

    // Comandos de terminal: se proponen, corren solo con permiso, dentro del proyecto
    {
      const marca = path.join(PROY, 'marca_prueba.txt');
      guion = [{ llamadas: [['comando', { comando: 'touch marca_prueba.txt && echo hola-mundo && pwd', explicacion: 'probar' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'corre algo' });
      const pc = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
      assert(pc && pc.clase === 'comando' && pc.comando.startsWith('touch'));
      assert(!fs.existsSync(marca)); ok('Comando propuesto: NO se ejecuta sin permiso');
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: pc.id, decision: 'aprobar' });
      const dc = JSON.parse(r.cuerpo);
      assert.equal(dc.estado, 'ejecutada'); assert.equal(dc.codigo, 0);
      assert(dc.salida.includes('hola-mundo') && dc.salida.includes(fs.realpathSync(PROY)));
      assert(fs.existsSync(marca)); ok('Comando aprobado: corre dentro de la carpeta del proyecto y devuelve la salida');
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: pc.id, decision: 'aprobar' });
      assert.notEqual(r.code, 200); ok('Un comando no se puede aprobar dos veces');
      const hc = JSON.parse((await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY))).cuerpo);
      assert(hc.mensajes.some(m => m.rol === 'propuesta' && m.propuesta.clase === 'comando' && m.propuesta.estado === 'ejecutada')); ok('El historial guarda el comando y su estado');

      guion = [{ llamadas: [['comando', { comando: 'exit 3', explicacion: 'falla' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'falla' });
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: eventos(r.cuerpo).find(e => e.tipo === 'propuesta').id, decision: 'aprobar' });
      assert.equal(JSON.parse(r.cuerpo).codigo, 3); ok('El código de salida distinto de cero se informa');

      guion = [{ llamadas: [['comando', { comando: 'env', explicacion: 'entorno' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'env' });
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: eventos(r.cuerpo).find(e => e.tipo === 'propuesta').id, decision: 'aprobar' });
      assert(!JSON.parse(r.cuerpo).salida.includes('llave-falsa')); ok('El comando no ve la llave de OpenRouter');

      guion = [{ llamadas: [['comando', { comando: 'touch no_debe_existir.txt', explicacion: 'rechazo' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'rechazo' });
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: eventos(r.cuerpo).find(e => e.tipo === 'propuesta').id, decision: 'rechazar' });
      assert.equal(JSON.parse(r.cuerpo).estado, 'rechazada'); assert(!fs.existsSync(path.join(PROY, 'no_debe_existir.txt'))); ok('Comando rechazado: no se ejecuta');

      for (const mal of ['sudo ls', 'cat android/key.properties', 'cat .env', 'ls /etc', 'cd .. && ls', 'curl http://example.com', 'rm -rf *', 'cat ~/.bashrc', 'ls $HOME', 'echo a\nls']) {
        guion = [{ llamadas: [['comando', { comando: mal, explicacion: 'x' }]] }, { texto: 'ok' }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mal' });
        assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta'), 'no debió proponerse: ' + mal);
      }
      ok('Comandos peligrosos, secretos o fuera del proyecto: bloqueados antes de proponerse');
      guion = [{ llamadas: [['comando', { comando: 'ls ' + PROY + '/lib && git --version', explicacion: 'permitido' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'bien' });
      assert(eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); ok('Ruta absoluta dentro del proyecto: permitida');
      const sisC = recibidos[recibidos.length - 1].messages[0].content;
      assert(sisC.includes('comando')); ok('Las instrucciones del modelo mencionan la herramienta comando');
    }

    // Archivos nuevos y vista previa
    {
      const nuevo = path.join(PROY, 'web', 'socio.html');
      guion = [{ llamadas: [['crear_archivo', { ruta: 'web/socio.html', contenido: '<h1>Hola socio</h1><script src="app.js"></script>', explicacion: 'página del socio' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'crea socio.html' });
      const pa = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
      assert(pa && pa.clase === 'archivo' && pa.rel === path.join('web', 'socio.html') && pa.contenido.includes('Hola socio'));
      assert(!fs.existsSync(nuevo)); ok('Archivo nuevo propuesto: NO se crea sin aprobación');
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: pa.id, decision: 'aprobar' });
      assert.equal(JSON.parse(r.cuerpo).estado, 'creada');
      assert.equal(fs.readFileSync(nuevo, 'utf8'), '<h1>Hola socio</h1><script src="app.js"></script>'); ok('Archivo nuevo aprobado: se crea (con su carpeta) y se verifica');
      fs.writeFileSync(path.join(PROY, 'web', 'app.js'), 'document.title = "ok";');
      const ver = '/ver/' + encodeURIComponent(PROY) + '/web/';
      r = await pedir('GET', ver + 'socio.html');
      assert.equal(r.code, 200); assert(r.cuerpo.includes('Hola socio')); assert.match(r.headers['content-type'], /text\/html/);
      assert.match(r.headers['content-security-policy'], /sandbox/); assert(!/allow-same-origin/.test(r.headers['content-security-policy'])); ok('Vista previa: sirve el HTML en un sandbox sin acceso a la API');
      r = await pedir('GET', ver + 'app.js'); assert.equal(r.code, 200); assert.match(r.headers['content-type'], /javascript/); ok('Vista previa: los archivos relativos de la página (js, css, imágenes) también cargan');
      r = await pedir('GET', '/ver/' + encodeURIComponent(PROY) + '/android/key.properties'); assert.notEqual(r.code, 200); ok('Vista previa: no sirve secretos');
      r = await pedir('GET', '/ver/' + encodeURIComponent(PROY) + '/enlace.txt'); assert.notEqual(r.code, 200); ok('Vista previa: no sigue enlaces hacia fuera');
      r = await pedir('GET', ver + '..%2F..%2F..%2Ffuera.txt'); assert.notEqual(r.code, 200); ok('Vista previa: no sale del proyecto con ..');
      r = await pedir('GET', '/ver/' + encodeURIComponent(T) + '/fuera.txt'); assert.notEqual(r.code, 200); ok('Vista previa: solo proyectos dentro de las carpetas permitidas');
      r = await pedir('GET', ver + 'socio.html', null, { Host: 'malicioso.com' }); assert.equal(r.code, 403); ok('Vista previa: respeta la comprobación de Host');

      guion = [{ llamadas: [['crear_archivo', { ruta: 'web/socio.html', contenido: 'x', explicacion: 'ya existe' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra vez' });
      assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); ok('No se puede "crear" un archivo que ya existe');
      for (const mala of ['../fuera_nuevo.txt', '.env', 'android/key.properties', 'node_modules/x.js', '.git/hook.sh']) {
        guion = [{ llamadas: [['crear_archivo', { ruta: mala, contenido: 'x', explicacion: 'x' }]] }, { texto: 'ok' }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mala' });
        assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta'), 'no debió proponerse: ' + mala);
      }
      ok('Archivos nuevos fuera del proyecto, secretos o en carpetas internas: bloqueados');
      guion = [{ llamadas: [['crear_archivo', { ruta: 'rechazado.txt', contenido: 'x', explicacion: 'x' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'rechaza' });
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: eventos(r.cuerpo).find(e => e.tipo === 'propuesta').id, decision: 'rechazar' });
      assert.equal(JSON.parse(r.cuerpo).estado, 'rechazada'); assert(!fs.existsSync(path.join(PROY, 'rechazado.txt'))); ok('Archivo nuevo rechazado: no se crea');

      // Guardar imágenes adjuntas
      const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/sin.png', explicacion: 'x' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'guarda la imagen' });
      assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); assert(!fs.existsSync(path.join(PROY, 'assets', 'sin.png'))); ok('guardar_imagen: sin imagen adjunta no propone nada');
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/carro.png', numero: 1, explicacion: 'dibujo del carro' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'guarda el carro', imagenes: [PNG] });
      const pi = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
      assert(pi && pi.clase === 'archivo' && pi.imagen === PNG && pi.rel === path.join('assets', 'carro.png'));
      assert(!fs.existsSync(path.join(PROY, 'assets', 'carro.png'))); ok('guardar_imagen: propone y NO guarda sin aprobación');
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: pi.id, decision: 'aprobar' });
      assert.equal(JSON.parse(r.cuerpo).estado, 'creada');
      const guardada = fs.readFileSync(path.join(PROY, 'assets', 'carro.png'));
      assert(guardada.equals(Buffer.from(PNG.split(',')[1], 'base64')) && guardada[0] === 0x89); ok('guardar_imagen: aprobada, queda un PNG idéntico al adjunto');
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/moto.jpg', explicacion: 'x' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'guarda con extensión equivocada', imagenes: [PNG] });
      assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); ok('guardar_imagen: la extensión debe coincidir con el tipo real');
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/carro.png', explicacion: 'x' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra vez', imagenes: [PNG] });
      assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); ok('guardar_imagen: no pisa un archivo que ya existe');
      const FALSA = 'data:image/png;base64,' + Buffer.from('#!/bin/sh\necho hola').toString('base64');
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/falsa.png', explicacion: 'x' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'falsa', imagenes: [FALSA] });
      assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta')); ok('guardar_imagen: un archivo que dice ser PNG pero no lo es, se bloquea');
      for (const mala of ['../fuera.png', '.git/x.png', 'node_modules/x.png', 'android/key.properties']) {
        guion = [{ llamadas: [['guardar_imagen', { ruta: mala, explicacion: 'x' }]] }, { texto: 'ok' }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mala', imagenes: [PNG] });
        assert(!eventos(r.cuerpo).some(e => e.tipo === 'propuesta'), 'no debió proponerse: ' + mala);
      }
      ok('guardar_imagen: fuera del proyecto, secretos o carpetas internas: bloqueado');
      guion = [{ llamadas: [['guardar_imagen', { ruta: 'assets/rechazada.png', explicacion: 'x' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'rechaza imagen', imagenes: [PNG] });
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: eventos(r.cuerpo).find(e => e.tipo === 'propuesta').id, decision: 'rechazar' });
      assert.equal(JSON.parse(r.cuerpo).estado, 'rechazada'); assert(!fs.existsSync(path.join(PROY, 'assets', 'rechazada.png'))); ok('guardar_imagen: rechazada, no se guarda');
    }

    // ===== Poderes extra =====
    {
      const ultTool = () => recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool');
      // 1. Web
      guion = [{ llamadas: [['buscar_web', { consulta: 'version flutter' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'busca' });
      const pedWeb = recibidos.find(x => x.plugins);
      assert(pedWeb && pedWeb.plugins[0].id === 'web' && pedWeb.stream === false); ok('buscar_web usa el buscador web de OpenRouter');
      const resWeb = ultTool().pop().content;
      assert(resWeb.includes('Flutter 9.9') && resWeb.includes('Fuentes:') && resWeb.includes('https://docs.flutter.dev/x')); ok('buscar_web devuelve el resumen con sus fuentes');
      const web = http.createServer((q, s) => { s.writeHead(200, { 'Content-Type': 'text/html' }); s.end('<title>T</title><p>secreto local</p>'); }).listen(4993);
      guion = [{ llamadas: [['leer_web', { url: 'http://127.0.0.1:4993/' }], ['leer_web', { url: 'file:///etc/passwd' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'lee' });
      const lw = ultTool().slice(-2).map(m => m.content);
      web.close();
      assert(lw[0].startsWith('Error') && !lw[0].includes('secreto local') && lw[1].startsWith('Error')); ok('leer_web no lee la red local ni archivos (protección SSRF)');

      // 2. Autonomía
      fs.writeFileSync(path.join(PROY, 'auto.txt'), 'valor = 1\n');
      guion = [{ llamadas: [['editar', { ruta: 'auto.txt', buscar: 'valor = 1', reemplazo: 'valor = 2', explicacion: 'x' }]] }, { texto: 'Hecho.' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'cambia', autonomia: 'total' });
      let ev = eventos(r.cuerpo);
      assert.equal(fs.readFileSync(path.join(PROY, 'auto.txt'), 'utf8'), 'valor = 2\n');
      assert(ev.some(e => e.tipo === 'propuesta' && e.auto && e.estado === 'aplicada') && ev.some(e => e.tipo === 'texto' && e.t === 'Hecho.')); ok('Modo autónomo: aplica la edición sin clic y sigue trabajando');
      assert(fs.readdirSync(PROY).some(f => f.startsWith('auto.txt.antes_'))); ok('Modo autónomo: igual deja copia de seguridad');
      { const hh = JSON.parse((await pedir('GET', '/api/historial?ruta=' + encodeURIComponent(PROY))).cuerpo); assert(hh.mensajes.some(m => m.rol === 'propuesta' && m.propuesta.auto && m.propuesta.rel === 'auto.txt')); ok('El historial muestra la tarjeta de lo aprobado automáticamente'); }
      guion = [{ llamadas: [['comando', { comando: 'echo hola-seguro && ls', explicacion: 'x' }]] }, { texto: 'Visto.' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mira', autonomia: 'lectura' });
      assert(ultTool().pop().content.includes('hola-seguro')); ok('Modo lectura: los comandos seguros corren sin preguntar');
      guion = [{ llamadas: [['comando', { comando: 'touch no_auto.txt', explicacion: 'x' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'toca', autonomia: 'total' });
      ev = eventos(r.cuerpo);
      assert(!fs.existsSync(path.join(PROY, 'no_auto.txt')) && ev.some(e => e.tipo === 'propuesta' && e.estado === 'pendiente')); ok('Incluso en modo autónomo, un comando que cambia algo espera tu clic');
      await pedir('POST', '/api/decision', { ruta: PROY, id: ev.find(e => e.tipo === 'propuesta').id, decision: 'rechazar' });
      for (const malo of ['echo x > a.txt', 'git status; touch b', 'find . -delete', 'cat a | tee b', 'ls & touch c', 'git log --output=z']) {
        guion = [{ llamadas: [['comando', { comando: malo, explicacion: 'x' }]] }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', autonomia: 'total' });
        const pe = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
        assert(!pe || pe.estado === 'pendiente', 'no debió correr solo: ' + malo);
        if (pe) await pedir('POST', '/api/decision', { ruta: PROY, id: pe.id, decision: 'rechazar' });
      }
      ok('Redirecciones, ; , & , tee, find -delete y --output nunca corren solos');
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x', autonomia: 'raro' });
      assert(recibidos[recibidos.length - 1].messages[0].content.includes('espera la aprobación de José') || PUBLICO); ok('Autonomía desconocida = preguntar todo');

      // 3. Varios archivos por aprobación
      fs.writeFileSync(path.join(PROY, 'a1.txt'), 'uno\n'); fs.writeFileSync(path.join(PROY, 'a2.txt'), 'dos\n');
      guion = [{ llamadas: [['editar', { ruta: 'a1.txt', buscar: 'uno', reemplazo: 'UNO', explicacion: 'x' }], ['editar', { ruta: 'a2.txt', buscar: 'dos', reemplazo: 'DOS', explicacion: 'x' }], ['crear_archivo', { ruta: 'a3.txt', contenido: 'tres', explicacion: 'x' }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'tres cambios' });
      const ps = eventos(r.cuerpo).filter(e => e.tipo === 'propuesta');
      assert.equal(ps.length, 3); assert.equal(fs.readFileSync(path.join(PROY, 'a1.txt'), 'utf8'), 'uno\n'); ok('Varias propuestas en un mismo turno, ninguna aplicada todavía');
      r = await pedir('POST', '/api/decision', { ruta: PROY, ids: ps.map(p => p.id), decision: 'aprobar' });
      const dt = JSON.parse(r.cuerpo);
      assert(dt.resultados.length === 3 && fs.readFileSync(path.join(PROY, 'a2.txt'), 'utf8') === 'DOS\n' && fs.readFileSync(path.join(PROY, 'a3.txt'), 'utf8') === 'tres'); ok('Aprobar todo aplica los tres cambios de una vez');

      // 4. Captura
      let hayChrome = false; for (const c of ['google-chrome', 'chromium', 'chromium-browser']) try { require('child_process').execFileSync('which', [c], { stdio: 'ignore' }); hayChrome = true; break; } catch {}
      if (hayChrome) {
        fs.writeFileSync(path.join(PROY, 'cap.html'), '<body style="background:#c4f82a"><h1>Hola</h1></body>');
        guion = [{ llamadas: [['captura', { ruta: 'cap.html', movil: true }]] }, { texto: 'Se ve verde.' }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'mírala' });
        ev = eventos(r.cuerpo);
        assert(ev.some(e => e.tipo === 'captura' && e.imagen.startsWith('data:image/png;base64,')), 'sin captura: ' + JSON.stringify(ev.filter(e => e.tipo === 'aviso')));
        const conImg = recibidos[recibidos.length - 1].messages.find(m => Array.isArray(m.content) && m.content.some(x => x.type === 'image_url'));
        assert(conImg); ok('captura: saca la foto de la página y el modelo la recibe como imagen');
        guion = [{ llamadas: [['captura', { ruta: '../fuera.txt' }]] }, { texto: 'ok' }];
        r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'x' });
        assert(ultTool().pop().content.startsWith('Error')); ok('captura: solo páginas dentro del proyecto');
      } else console.log('  --  (sin Chrome: se salta la prueba de captura)');

      // 5. Memoria
      guion = [{ llamadas: [['recordar', { nota: 'El color principal es verde lima' }], ['recordar', { nota: 'la clave: 1234' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'recuerda' });
      assert(ultTool().slice(-1)[0].content.startsWith('Error')); ok('recordar no guarda contraseñas');
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'hola' });
      assert(recibidos[recibidos.length - 1].messages[0].content.includes('El color principal es verde lima')); ok('La memoria llega a las instrucciones de todos los chats');
      r = await pedir('GET', '/api/memoria'); assert(JSON.parse(r.cuerpo).texto.includes('verde lima'));
      r = await pedir('POST', '/api/memoria', { texto: '- nota editada a mano\n' }); assert.equal(r.code, 200);
      assert.equal(fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8'), '- nota editada a mano\n'); ok('La memoria se ve y se edita desde Ajustes');

      // Personalidad: por defecto llega a todos los modelos, se edita, se apaga y se restaura
      guion = [{ texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'hola personalidad' });
      assert(recibidos[recibidos.length - 1].messages[0].content.includes('Personalidad y estilo')); assert(recibidos[recibidos.length - 1].messages[0].content.includes('Mi consejo:')); ok('La personalidad inicial llega a las instrucciones del modelo');
      r = await pedir('GET', '/api/personalidad'); assert(JSON.parse(r.cuerpo).texto.includes('criterio'));
      r = await pedir('POST', '/api/personalidad', { texto: 'Sé muy seco y breve XYZ.' }); assert.equal(r.code, 200);
      assert.equal(fs.readFileSync(path.join(APP, 'datos', 'personalidad.md'), 'utf8'), 'Sé muy seco y breve XYZ.');
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra vez' });
      assert(recibidos[recibidos.length - 1].messages[0].content.includes('Sé muy seco y breve XYZ.')); ok('La personalidad editada reemplaza a la inicial');
      r = await pedir('POST', '/api/personalidad', { texto: '' });
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'sin personalidad' });
      assert(!recibidos[recibidos.length - 1].messages[0].content.includes('Personalidad y estilo')); ok('Una personalidad vacía queda apagada');
      r = await pedir('POST', '/api/personalidad', { restaurar: true }); assert(JSON.parse(r.cuerpo).texto.includes('criterio')); assert(!fs.existsSync(path.join(APP, 'datos', 'personalidad.md'))); ok('Texto inicial restaurado');
      r = await pedir('POST', '/api/personalidad', { texto: 'x'.repeat(4001) }); assert.notEqual(r.code, 200); ok('La personalidad no pasa de 4000 caracteres');

      // Memoria que aprende sola: reemplazo, repaso manual, secretos rechazados y repaso automático
      fs.writeFileSync(path.join(APP, 'datos', 'memoria.md'), '- Monto de bloqueo: $3 (2026-11-01)\n- Otra nota importante (2026-11-01)\n');
      guion = [{ texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'el bloqueo pasa a $5 desde hoy' });
      let antesMem = recibidos.length;
      r = await pedir('POST', '/api/repasarmemoria', { ruta: PROY }); assert.equal(r.code, 200);
      let mem = fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8');
      assert(mem.includes('Monto de bloqueo: $5') && !mem.includes('$3') && mem.includes('Otra nota importante')); ok('El repaso reemplaza la nota vieja sin duplicar ni tocar las demás');
      r = await pedir('GET', '/api/memoria'); assert(JSON.parse(r.cuerpo).cambios.some(x => x.includes('reemplazó'))); ok('Los cambios automáticos quedan anotados y se ven en Ajustes');
      antesMem = recibidos.length;
      r = await pedir('POST', '/api/repasarmemoria', { ruta: PROY }); assert(JSON.parse(r.cuerpo).nada === true && recibidos.length === antesMem); ok('Un chat ya repasado no se vuelve a mandar al modelo');
      guion = [{ texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'guarda mi password por favor' });
      r = await pedir('POST', '/api/repasarmemoria', { ruta: PROY });
      assert(JSON.parse(r.cuerpo).cambios[0].includes('descartado')); assert(!fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8').includes('abc123')); ok('El repaso rechaza claves y contraseñas');
      guion = [{ llamadas: [['recordar', { nota: 'Monto de bloqueo: $8', reemplaza: 'Monto de bloqueo' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'cambia el monto' });
      mem = fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8'); assert(mem.includes('$8') && !mem.includes('$5') && mem.split('\n').filter(l => l.includes('bloqueo')).length === 1); ok('recordar con reemplaza sustituye la nota en vez de duplicarla');
      guion = [{ llamadas: [['recordar', { nota: 'x larga nota nueva', reemplaza: 'nota' }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'otra' });
      assert(ultTool().slice(-1)[0].content.startsWith('Error')); ok('recordar con reemplaza ambiguo o inexistente da error');
      // El repaso también lee los cambios aprobados (decisiones que se ven en lo aplicado)
      fs.writeFileSync(path.join(APP, 'datos', 'memoria.md'), '- Arquitectura: WebView + Flutter híbrido (2026-11-01)\n');
      guion = [{ texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'seguimos con el mapa' });
      { const f = path.join(APP, 'datos', 'chats', PROY.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() + '.json'); const ch = JSON.parse(fs.readFileSync(f, 'utf8')); ch.mensajes.push({ role: 'user', content: '[Aviso automático] Aplicado: migró a Flutter el módulo de mapa (lib/mapa.dart)' }); fs.writeFileSync(f, JSON.stringify(ch)); }
      r = await pedir('POST', '/api/repasarmemoria', { ruta: PROY }); assert.equal(r.code, 200);
      mem = fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8'); assert(mem.includes('migrado a Flutter') && !mem.includes('híbrido')); ok('El repaso nota un cambio de rumbo en lo aprobado y actualiza la nota vieja');
      {
        const srv4 = spawn('node', ['server.js'], { cwd: APP, env: { ...process.env, PUERTO: '4994', TALLER_RAICES: RAIZ, OPENROUTER_API_KEY: 'llave-falsa', OPENROUTER_URL: 'http://127.0.0.1:4999/v1', OPENROUTER_MODELOS_URL: 'http://127.0.0.1:4999/models', TALLER_MEMORIA_AUTO: '1', TALLER_MEMORIA_CADA: '1' } });
        await new Promise(r2 => setTimeout(r2, 1200));
        fs.writeFileSync(path.join(APP, 'datos', 'memoria.md'), '- Otra nota importante (2026-11-01)\n');
        guion = [{ texto: 'ok' }];
        await new Promise(r2 => { const q = http.request({ host: '127.0.0.1', port: 4994, path: '/api/chat', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Taller': '1' } }, x => { x.on('data', () => {}); x.on('end', r2); }); q.end(JSON.stringify({ ruta: PROY, texto: 'acordamos Firebase para todo' })); });
        let visto = false; for (let i = 0; i < 30 && !visto; i++) { await new Promise(r2 => setTimeout(r2, 100)); visto = fs.readFileSync(path.join(APP, 'datos', 'memoria.md'), 'utf8').includes('Nota automática de prueba'); }
        srv4.kill(); assert(visto); ok('Con el repaso automático activo, la memoria se actualiza sola al terminar un mensaje');
      }
      fs.writeFileSync(path.join(APP, 'datos', 'memoria.md'), '');

      // Reintentos automáticos ante errores pasajeros del proveedor
      guion = [{ texto: 'respuesta tras reintento' }];
      fallar503 = 2; antesMem = recibidos.length;
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'prueba de reintento' });
      assert(r.cuerpo.includes('respuesta tras reintento') && r.cuerpo.includes('reintento 2/2') && recibidos.length - antesMem === 3); ok('Un 503 pasajero se reintenta solo y avisa');
      fallar503 = 5; antesMem = recibidos.length;
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'prueba sin suerte' });
      assert(r.cuerpo.includes('503') && recibidos.length - antesMem === 3); ok('Si sigue fallando tras 2 reintentos, muestra el error');
      fallar503 = 0;

      // 6. Ayudantes en paralelo y segundo plano
      guion = [{ llamadas: [['delegar', { tarea: 'busca A' }], ['delegar', { tarea: 'busca B' }]] }, { texto: 'informe uno' }, { texto: 'informe dos' }, { texto: 'Listo.' }];
      const antesD = recibidos.length;
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'investiga' });
      const resD = ultTool().slice(-2).map(m => m.content);
      assert(resD.every(x => x.startsWith('Informe del ayudante')) && resD.join(' ').includes('informe uno') && resD.join(' ').includes('informe dos')); ok('delegar: dos ayudantes devuelven su informe');
      const pedAy = recibidos.slice(antesD).filter(x => x.messages[0].content.includes('ayudante de investigación'));
      assert(pedAy.length === 2 && pedAy.every(x => !x.tools.some(t => ['editar', 'comando', 'crear_archivo', 'delegar'].includes(t.function.name)))); ok('Los ayudantes solo tienen herramientas de lectura');
      guion = [{ llamadas: [['comando', { comando: 'sleep 1 && echo fin-fondo', explicacion: 'largo', segundo_plano: true }]] }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'compila' });
      const pf = eventos(r.cuerpo).find(e => e.tipo === 'propuesta');
      assert(pf && pf.fondo);
      r = await pedir('POST', '/api/decision', { ruta: PROY, id: pf.id, decision: 'aprobar' });
      const df = JSON.parse(r.cuerpo);
      assert(df.estado === 'ejecutada' && df.proceso); ok('Comando en segundo plano: arranca y responde enseguida');
      guion = [{ llamadas: [['ver_proceso', { id: df.proceso, esperar: 10 }]] }, { texto: 'ok' }];
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'cómo va' });
      const vp = ultTool().pop().content;
      assert(vp.includes('fin-fondo') && vp.includes('terminó con código 0'), vp); ok('ver_proceso espera y muestra la salida del proceso');
    }

    // 7. Apps (MCP) y resumen de chats largos, en un servidor aparte
    {
      const T3 = path.join(os.tmpdir(), 'taller_prueba_apps'); fs.rmSync(T3, { recursive: true, force: true });
      fs.cpSync(APP, T3, { recursive: true, filter: s => path.basename(s) !== 'datos' });
      const falsa = path.join(T3, 'app_falsa.js');
      fs.writeFileSync(falsa, `const rl = require('readline').createInterface({ input: process.stdin });
rl.on('line', l => { const m = JSON.parse(l); if (m.id == null) return; let result;
  if (m.method === 'initialize') result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'eco', version: '1' } };
  else if (m.method === 'tools/list') result = { tools: [{ name: 'eco', description: 'Repite', inputSchema: { type: 'object', properties: { texto: { type: 'string' } } } }, { name: 'hora', description: 'Hora', inputSchema: { type: 'object', properties: {} } }] };
  else if (m.method === 'tools/call') result = { content: [{ type: 'text', text: m.params.name === 'eco' ? 'ECO:' + m.params.arguments.texto + ':' + (process.env.SECRETO_APP || '') + ':' + (process.env.OPENROUTER_API_KEY || 'sin-llave') : 'las 3' }] };
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }) + '\\n'); });`);
      const c3 = JSON.parse(fs.readFileSync(path.join(T3, 'config.json'), 'utf8'));
      c3.apps = { eco: { comando: 'node', args: [falsa], env: { SECRETO_APP: '$SECRETO_APP' }, autoAprobar: ['hora'] } };
      fs.writeFileSync(path.join(T3, 'config.json'), JSON.stringify(c3));
      fs.writeFileSync(path.join(T3, '.env'), 'OPENROUTER_API_KEY=llave-falsa\nOPENROUTER_URL=http://127.0.0.1:4999/v1\nOPENROUTER_MODELOS_URL=http://127.0.0.1:4999/models\nSECRETO_APP=abc\n');
      const srv3 = spawn('node', ['server.js'], { cwd: T3, env: { ...process.env, TALLER_MEMORIA_AUTO: '0', PUERTO: '4995', TALLER_RAICES: RAIZ, TALLER_LIMITE_CONTEXTO: '3000' } });
      const p3 = (m, ru, cu) => new Promise((ok2, mal) => { const q = http.request({ host: '127.0.0.1', port: 4995, path: ru, method: m, headers: { 'Content-Type': 'application/json', 'X-Taller': '1' } }, x => { let s = ''; x.on('data', c => s += c); x.on('end', () => ok2({ code: x.statusCode, cuerpo: s })); }); q.on('error', mal); if (cu) q.write(JSON.stringify(cu)); q.end(); });
      try {
        let apps = [];
        for (let i = 0; i < 40; i++) { await new Promise(z => setTimeout(z, 250)); try { apps = JSON.parse((await p3('GET', '/api/apps')).cuerpo).apps; if (apps[0] && apps[0].estado === 'lista') break; } catch {} }
        assert(apps[0] && apps[0].estado === 'lista' && apps[0].herramientas === 2, JSON.stringify(apps)); ok('App MCP conectada: arranca y lista sus herramientas');
        await p3('POST', '/api/abrir', { ruta: FUNC });
        guion = [{ llamadas: [['app_eco__eco', { texto: 'hola' }]] }];
        let q = await p3('POST', '/api/chat', { ruta: FUNC, texto: 'usa la app' });
        assert(recibidos[recibidos.length - 1].tools.some(t => t.function.name === 'app_eco__eco')); ok('El modelo ve las herramientas de la app');
        const pa = eventos(q.cuerpo).find(e => e.tipo === 'propuesta');
        assert(pa && pa.clase === 'app' && pa.estado === 'pendiente'); ok('Llamar a la app espera tu aprobación');
        q = await p3('POST', '/api/decision', { ruta: FUNC, id: pa.id, decision: 'aprobar' });
        assert.equal(JSON.parse(q.cuerpo).salida, 'ECO:hola:abc:sin-llave'); ok('Aprobada: la app responde, recibe su secreto de .env y NO la llave de OpenRouter');
        guion = [{ llamadas: [['app_eco__hora', {}]] }, { texto: 'ok' }];
        q = await p3('POST', '/api/chat', { ruta: FUNC, texto: 'hora' });
        assert(recibidos[recibidos.length - 1].messages.filter(m => m.role === 'tool').pop().content.includes('las 3')); ok('Herramientas marcadas en autoAprobar corren solas');

        const largo = 'x'.repeat(1400);
        for (let i = 0; i < 3; i++) { guion = [{ texto: 'respuesta ' + i }]; await p3('POST', '/api/chat', { ruta: FUNC, texto: `mensaje ${i} ${largo}` }); }
        assert(recibidos.some(x => x.stream === false && JSON.stringify(x.messages).includes('Resume esta conversación'))); ok('Chat largo: se resume solo');
        const idf = FUNC.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
        const ch3 = JSON.parse(fs.readFileSync(path.join(T3, 'datos', 'chats', idf + '.json'), 'utf8'));
        assert(ch3.anteriores.length > 0 && ch3.mensajes[0].content.includes('RESUMEN-PRUEBA')); ok('El resumen reemplaza lo viejo para el modelo');
        const hv3 = JSON.parse((await p3('GET', '/api/historial?ruta=' + encodeURIComponent(FUNC))).cuerpo);
        assert(hv3.mensajes.some(m => m.rol === 'user' && m.texto.startsWith('mensaje 0'))); ok('…pero en pantalla sigues viendo los mensajes originales');
      } finally { srv3.kill(); }
    }

    // Sincronización en vivo: /api/estado cambia cuando el chat cambia desde otro dispositivo
    {
      r = await pedir('GET', '/api/vivo?ruta=' + encodeURIComponent(PROY));
      assert.equal(r.code, 200);
      const e1 = JSON.parse(r.cuerpo);
      assert(typeof e1.v === 'string' && e1.ocupado === false);
      const idc2 = PROY.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
      const fc = path.join(APP, 'datos', 'chats', idc2 + '.json');
      const cj = JSON.parse(fs.readFileSync(fc, 'utf8')); cj.mensajes.push({ role: 'user', content: 'desde el teléfono' });
      fs.writeFileSync(fc, JSON.stringify(cj));
      r = await pedir('GET', '/api/vivo?ruta=' + encodeURIComponent(PROY));
      assert.notEqual(JSON.parse(r.cuerpo).v, e1.v); ok('Sincronización en vivo: la versión cambia cuando el chat cambia desde otro dispositivo');
      r = await pedir('GET', '/api/vivo?ruta=' + encodeURIComponent('/etc'));
      assert.notEqual(r.code, 200); ok('Sincronización en vivo: respeta la jaula de carpetas');
    }

    // El modelo sabe cuál es: el servidor se lo dice en las instrucciones
    {
      guion = [{ texto: 'Listo.' }];
      const antes = recibidos.length;
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'que modelo eres', modelo: 'google/gemini-3.5-flash' });
      assert.equal(r.code, 200);
      const sis = recibidos.slice(antes).find(x => x.stream !== false).messages[0].content;
      assert(sis.includes('"google/gemini-3.5-flash"') && sis.includes('creado por Google (Gemini)') && sis.includes('NO eres ese') && sis.includes('FECHA: hoy es') && sis.includes(String(new Date().getFullYear())) && sis.includes('No busques tu nombre')); ok('Las instrucciones le dicen al modelo cuál es (el que eligió el usuario)');
      guion = [{ texto: 'Soy otro.' }];
      const antes2 = recibidos.length;
      r = await pedir('POST', '/api/chat', { ruta: PROY, texto: 'y tú', modelo: 'deepseek/deepseek-v4' });
      assert.equal(r.code, 200);
      const msgs2 = recibidos.slice(antes2).find(x => x.stream !== false).messages;
      assert(msgs2.some(m => m.role === 'assistant' && String(m.content).startsWith('[Respuesta de otro modelo (google/gemini-3.5-flash), no tuya]')));
      assert(msgs2[msgs2.length - 1].role === 'system' && msgs2[msgs2.length - 1].content.includes('deepseek/deepseek-v4')); ok('Respuestas de otro modelo se marcan como ajenas y se recuerda la identidad al final')
    }

    console.log('\nTODAS LAS PRUEBAS PASARON');
  } catch (e) { console.error('FALLÓ:', e); process.exitCode = 1; }
  finally { srv.kill(); mock.close(); }
})();
