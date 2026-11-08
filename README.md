# Taller Code

Interfaz local para trabajar con un agente de programación usando **cualquier modelo de OpenRouter**. Lee tu código por rangos, propone cambios y **no aplica nada hasta que tú lo apruebas**. Antes de aplicar, guarda una copia del archivo.

Hecho por un desarrollador independiente en Venezuela, para seguir trabajando con IA cuando las herramientas comerciales no estaban disponibles.

**Qué incluye**
- Chat con respuestas formateadas (títulos, listas, tablas, código con botón *Copiar*).
- Cambios propuestos con vista *Antes / Después*, aprobación manual y copia de seguridad automática.
- Cualquier modelo de OpenRouter que acepte herramientas; el costo se ve en vivo.
- Imágenes: pega capturas con Ctrl+V si el modelo las lee.
- 🔊 Lectura en voz alta de las respuestas.
- Varios proyectos en el mismo chat (por ejemplo una app y sus Cloud Functions).
- Acceso opcional desde el teléfono, con clave.
- Sin dependencias: solo Node.js.

## Qué necesitas

- Node.js 18 o superior ([nodejs.org](https://nodejs.org)).
- Una cuenta de OpenRouter con crédito y una llave API. Recomendado: crea la llave con un **límite de gasto**.

## Instalación

1. Descarga y descomprime el proyecto (o clónalo con git).
2. Desde una terminal, dentro de la carpeta `taller_publico`:
   ```
   node server.js
   ```
   (o `npm start`). Debe decir `Taller Code listo en http://127.0.0.1:4321`. Deja esa terminal abierta mientras lo uses: si la cierras, se apaga.
   - Ejemplo en Linux o Mac con el zip en Descargas:
     ```
     cd ~/Descargas && unzip taller_publico.zip && cd taller_publico && node server.js
     ```
   - En Windows: clic derecho en el zip, *Extraer todo*, y abre una terminal dentro de la carpeta.
3. Abre <http://127.0.0.1:4321> en el navegador.
4. Pega tu llave en **Llave de OpenRouter** y pulsa *Guardar*. Taller Code comprueba que funcione y la guarda en el archivo `.env`, solo en tu equipo.
5. Pega la ruta de tu proyecto en el chat y pulsa Enter (también puedes escribirla en el campo **Ruta del proyecto**).

## Uso básico

1. Escribe qué quieres cambiar. El agente busca y lee solo lo necesario.
2. Te muestra el cambio (**Antes / Después**). Tú decides: **Aprobar y aplicar** o **Rechazar**.
3. Al aprobar se crea `archivo.antes_<fecha>` junto al original y luego se escribe el cambio.
4. Compilar y probar: el agente puede proponer comandos (por ejemplo `flutter analyze` o `npm test`), pero nada corre hasta que pulses **Permitir una vez**.

Para **deshacer** un cambio, copia la versión guardada sobre el archivo:

```
cp lib/main.dart.antes_20261106_074517 lib/main.dart
```

Cada proyecto tiene su propio chat, historial y costo. Para cambiar de proyecto, tócalo en la lista de la izquierda. **Nuevo chat** archiva el chat anterior con la fecha y empieza uno limpio. En el teléfono la barra lateral se esconde y se abre con el botón ☰ de arriba a la izquierda. La barra lateral solo muestra los chats; el botón **⚙ Ajustes** (abajo) abre el panel con proyectos, modelo, voz, costos y llave, y **← Chats** vuelve. Arriba de la barra lateral está **Recientes**: todos tus chats de todos los proyectos, el más nuevo primero, con un título corto sacado de tu primer mensaje (sin gastar tokens). Un clic abre el chat (y cambia de proyecto solo), hay un buscador, y la ✕ borra un chat archivado. Todo vive en `datos/chats/`; copia esa carpeta para respaldarlo.

Marca **Proyecto real** para que la barra se ponga roja cuando trabajes en algo que no es una copia. Verde significa copia de pruebas. Si el proyecto tiene un archivo `AGENTS.md`, el agente lo usa como reglas.

## Modelos y costos

- Escribe el nombre del modelo tal cual aparece en OpenRouter (por ejemplo `openai/gpt-6.1-sol`). Hay lista de sugerencias.
- El modelo debe aceptar **herramientas**. Para adjuntar imágenes debe además **leer imágenes**.
- El costo de cada mensaje y de la sesión se muestra en la barra lateral.
- El **esfuerzo de razonamiento** (más alto = piensa más y cuesta más) se elige en la barra lateral.
- Para gastar menos, Taller Code reemplaza los resultados viejos de herramientas por un aviso y envía las imágenes solo con el mensaje más reciente.

## Varios proyectos en el mismo chat

Si tu producto tiene varias carpetas relacionadas (la app, otra app, las Cloud Functions), júntalas en un solo chat para que la IA vea todo:

1. Abre el proyecto principal pegando su ruta.
2. Suma los demás escribiendo en el chat `+ /ruta/del/otro/proyecto`, o con el botón **＋** de la lista de proyectos.
3. Los proyectos sumados aparecen como etiquetas en la barra de arriba (con ✕ para quitarlos). Máximo 4.

Cada cambio propuesto muestra a qué proyecto pertenece, se aplica solo ahí, y la copia de seguridad queda junto al archivo cambiado. Cada proyecto sigue encerrado en su propia carpeta. Si alguno está marcado como real, la barra se pone roja. La IA propone de a un cambio y espera tu decisión.

## Escuchar las respuestas (🔊)

Debajo de cada respuesta hay un botón 🔊. Al pulsarlo, tu navegador la lee en voz alta (⏹ para detener). No lee bloques de código ni enlaces. Es gratis y no usa tu saldo de OpenRouter. La voz se elige en la barra lateral. Su calidad depende de tu sistema y navegador: en Linux puede sonar robótica o no haber voces en español; Chrome o Edge suelen tener mejores voces.

## Usarlo desde el teléfono (misma WiFi)

Por defecto Taller Code solo se abre en la propia PC. Para usarlo también desde el teléfono (para chatear o para dictar con micrófono):

```
TALLER_RED=1 node server.js
```

En Windows, lo más simple es poner `"red": true` en `config.json`.

La terminal mostrará una dirección tipo `http://192.168.x.x:4321` y una **clave de acceso**. Ábrela en el teléfono y escribe la clave una vez. La clave queda guardada en `datos/acceso.json`.

- Solo funciona dentro de tu red WiFi, y solo con direcciones de red privada.
- Tras 5 claves incorrectas se bloquea un minuto.
- La dirección `http://…:4321` no está cifrada: úsala en tu casa, no en WiFi públicas.
- Para **dictar con el micrófono** el navegador del teléfono exige https: usa la dirección `https://…:4322` que también muestra la terminal (la primera vez acepta la advertencia del certificado: toca *Avanzado → Continuar*). El certificado propio lo crea Taller Code con `openssl`.
- Lo que escribes o dictas desde el teléfono aparece solo en la PC (y al revés), sin recargar.
- Los comandos de terminal **no se pueden aprobar desde el teléfono**, solo desde la PC (ver más abajo).
- Los cambios a archivos siguen necesitando tu aprobación, también desde el teléfono.

## Crear archivos y ver páginas (▶ Ver)

- **Archivos nuevos:** la IA puede proponer crear un archivo (por ejemplo `socio.html`). Ves el contenido completo en una tarjeta y pulsas **Crear archivo** o **Rechazar**. No pisa archivos que ya existen, no escribe fuera del proyecto ni en carpetas internas (`.git`, `node_modules`…), y bloquea nombres de secretos.
- **Ver:** cuando se crea o se edita un `.html`, la tarjeta muestra un botón **▶ Ver** que lo abre en otra pestaña con sus archivos relativos (css, js, imágenes). La página corre aislada (sandbox) y no puede usar la API de Taller Code.

## Dictar con el micrófono (🎤)

El botón **🎤 Dictar** graba tu voz, la manda a transcribir con un modelo Gemini a través de tu llave de OpenRouter y deja el texto en la caja para que lo revises. Nunca se envía solo. Cada dictado cuesta una fracción de centavo y se muestra en pantalla. El modelo se elige solo (el Gemini más barato con entrada de audio); si falla, fija uno con `"modeloVoz"` en `config.json`. En la PC funciona desde `http://127.0.0.1:4321`; en el teléfono, desde la dirección https (ver arriba).

## Comandos de terminal

Cuando la IA necesita compilar, analizar o probar, **propone** un comando y sale una tarjeta con `$ el comando` y dos botones: **Permitir una vez** o **Rechazar**. Nada corre sin tu clic.

- Corre dentro de la carpeta del proyecto, sin teclado (si pide datos, falla) y con un tiempo límite (120 s por defecto). La salida y el código de salida aparecen en la tarjeta y la IA continúa con ese resultado.
- No ve tu llave de OpenRouter.
- Bloqueado siempre: `sudo`, `curl`/`wget`/`ssh`, archivos secretos, `..`, `~`, rutas fuera de los proyectos del chat y borrar la carpeta entera.
- El filtro es una segunda barrera, no una garantía: la primera eres tú, lee cada comando antes de permitirlo.
- Solo se aprueban desde la PC donde corre Taller Code, salvo que pongas `"comandosDesdeRed": true`.

## Autonomía y herramientas avanzadas

**Autonomía** (en ⚙ Ajustes):

| Modo | Qué hace sin preguntar |
| --- | --- |
| Preguntar todo | Nada: cada cambio, comando o app espera tu clic. |
| Comandos seguros sin preguntar | Comandos de solo lectura y análisis: `git status/diff/log`, `ls`, `cat`, `grep`, `flutter analyze`, `flutter test`, `npm test`… |
| Autónomo | Además aplica ediciones y archivos nuevos (siempre con copia `.antes_`) y sigue trabajando de corrido: cambia, verifica, corrige. |

En ningún modo corren solos los comandos que cambian algo (`rm`, `git commit`, `flutter build`, cualquier `>` o `;`) ni las apps: esos siempre esperan **Permitir una vez**. Las tarjetas aprobadas por el modo autónomo dicen **⚡ automático**.

**Varios cambios a la vez.** La IA puede proponer varios cambios en el mismo turno; aparece **Aprobar todo (N)** para aplicarlos con un solo clic.

**Internet.** `buscar_web` busca con el buscador de OpenRouter y devuelve un resumen con sus fuentes (cuesta unos centavos por búsqueda). `leer_web` lee una página pública completa, por ejemplo documentación. Por seguridad no lee direcciones de tu red local ni de la PC.

**Captura.** La IA puede sacar una foto de una página `.html` del proyecto (tamaño PC o teléfono) y verla para corregir el diseño. Necesita Chrome o Chromium instalado y un modelo que vea imágenes (Sol, Gemini). La foto también aparece en el chat.

**Memoria.** La IA guarda notas permanentes con `recordar` (decisiones, preferencias) y las ve al empezar cualquier chat. Las ves y editas en **⚙ Ajustes → Memoria**. No guarda llaves ni contraseñas. Además, cuando un chat se hace muy largo, la parte antigua se resume sola para que siga rápido y barato; en pantalla sigues viendo todos los mensajes.

**Ayudantes y procesos largos.** Con `delegar` la IA lanza ayudantes de solo lectura que investigan en paralelo y le devuelven un informe. Los comandos largos (`flutter build apk`) pueden correr en **segundo plano**: la tarjeta dice "▶ En segundo plano" y la IA revisa su avance con `ver_proceso` (límite: 1 hora, máximo 4 a la vez).

**Apps conectadas (MCP).** En `config.json`, la clave `"apps"` conecta servidores MCP que corren en tu PC. Cada llamada pide tu aprobación, salvo las que pongas en `autoAprobar`. Los secretos van en `.env` y se citan con `$NOMBRE`. Ejemplo con Supabase en solo lectura (verifica el comando en la documentación de Supabase):

```json
"apps": {
  "supabase": {
    "comando": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=TU_PROYECTO"],
    "env": { "SUPABASE_ACCESS_TOKEN": "$SUPABASE_ACCESS_TOKEN" },
    "autoAprobar": ["list_tables"]
  }
}
```

y en `.env`: `SUPABASE_ACCESS_TOKEN=...`. Reinicia Taller Code; en **⚙ Ajustes** verás si la app quedó lista. Gmail y Google Drive también tienen servidores MCP, pero exigen crear credenciales OAuth de Google en tu cuenta.

## Trabajar en otras carpetas o discos

Por defecto Taller Code solo puede trabajar dentro de tu carpeta personal. Si tu proyecto está en otro lugar, agrégalo en `config.json`, en `"raices"`, y reinicia Taller Code:

```json
"raices": ["/home/maria", "/media/maria/MiDisco"]
```

En Windows, las barras invertidas van dobles: `"raices": ["C:\\Users\\maria", "D:\\Proyectos"]`.

Si abres un proyecto fuera de esas carpetas, Taller Code responde "Carpeta fuera de las permitidas" y te muestra cuáles sí lo están. Si conectas un disco después de arrancar Taller Code, no hace falta reiniciar.

## Ajustes (`config.json`)

| Clave | Para qué sirve |
|---|---|
| `raices` | Carpetas donde se permite trabajar. Vacío = tu carpeta personal. |
| `modelos` | Botones de acceso rápido (nombres exactos de OpenRouter). |
| `instrucciones` | Texto opcional que se añade a las instrucciones del agente. |
| `puerto` | Por defecto 4321. |
| `red` | `true` para el acceso desde el teléfono (ver arriba). |
| `puertoHttps` | Puerto https para el micrófono del teléfono. Por defecto, el puerto + 1. |
| `modeloVoz` | Modelo para dictar, si la elección automática falla. |
| `tiempoComando` | Segundos máximos por comando (por defecto 120, máximo 900). |
| `rutasComandos` | Carpetas extra permitidas en comandos y agregadas al PATH (por ejemplo donde está Flutter). |
| `comandosDesdeRed` | `true` para poder aprobar comandos desde el teléfono (no recomendado). |
| `apps` | Apps conectadas por MCP (ver "Autonomía y herramientas avanzadas"). |
| `modeloWeb` | Modelo para `buscar_web` (por defecto, el del chat). |
| `navegador` | Ruta de Chrome/Chromium para `captura`, si no lo encuentra solo. |
| `tiempoFondo` | Segundos máximos de un comando en segundo plano (por defecto 3600). |
| `limiteContexto` | Caracteres de chat antes de resumir lo antiguo (por defecto 240000). |
| `maxPasos` | Máximo de pasos por mensaje (por defecto 40). |

## Cambiar el color

En `public/index.html`, al principio, está la variable `--accent: #c4f82a;`. Cámbiala por el color que prefieras (por ejemplo un naranja, `#ff7a1a`) y recarga la página.

## Problemas comunes

| Síntoma | Qué hacer |
|---|---|
| `EADDRINUSE: address already in use` | Taller Code ya está corriendo en otra terminal. Ciérrala (Ctrl+C) o cambia `"puerto"`. En Linux: `pkill -f "node server.js"`. |
| `OpenRouter no reconoce la llave` (401) | La llave está mal copiada o la borraste. Pega una nueva en el campo de la izquierda. |
| `La llave se quedó sin crédito` (402) | Sube el límite de la llave o recarga saldo en OpenRouter. |
| `Esa carpeta no existe` con un disco externo | El disco no está montado. |
| "Carpeta fuera de las permitidas" | Agrega la carpeta en `raices` de `config.json`. |
| El modelo no hace nada o dice "no acepta herramientas" | Elige otro modelo que permita herramientas. |
| "Ese modelo no lee imágenes" | Elige un modelo con visión o quita la imagen. |
| La página del teléfono pide clave | Es el acceso por red: escribe la clave que muestra la terminal. |

## Seguridad

- Por defecto solo responde en tu propio equipo (127.0.0.1). El acceso por WiFi es opcional y exige clave.
- Terminal con permiso: el agente solo PROPONE comandos; cada uno corre únicamente si lo permites, dentro de la carpeta del proyecto, con tiempo límite, sin la llave de OpenRouter y con un filtro que bloquea `sudo`, red directa (`curl`, `ssh`), archivos secretos, `..` y rutas fuera del proyecto.
- Solo trabaja dentro de las carpetas permitidas; rechaza rutas que se salgan, incluidos enlaces simbólicos.
- Bloquea archivos secretos: `.env`, `key.properties`, `*.jks`, `*.keystore`, `*.p12`, `*.pem`, `*.key` y cuentas de servicio.
- Ignora carpetas pesadas o internas: `.git`, `node_modules`, `build`, `.dart_tool`, `.gradle`, `.idea`, `.vscode`, `Pods`.
- Todo cambio exige tu aprobación.
- Los chats se guardan en `datos/chats/` en tu equipo.

## Privacidad

Los fragmentos de código que el agente lee se envían a OpenRouter y al proveedor del modelo que elijas. No lo uses con código que no puedas compartir con ellos.

## Límites conocidos

- Probado en Ubuntu con Node 22. Windows y Mac sin probar. En Windows, pegar la ruta en el chat solo reconoce rutas tipo Linux; usa el campo **Ruta del proyecto**.
- No ejecuta nada por su cuenta: todo comando necesita tu clic en **Permitir una vez**, y por defecto solo se aprueba desde la PC donde corre (no desde el teléfono).

## Licencia

MIT. Se ofrece tal cual, sin garantía. Ver `LICENSE`.

## Desarrollo y pruebas

Para comprobar que nada se rompió después de modificar Taller Code:

```
node pruebas/prueba.js
```

Corre las pruebas sobre una copia temporal, con un OpenRouter simulado: no usa tu llave ni gasta saldo, y necesita los puertos 4998 y 4999 libres. Las reglas para quien lo modifique (persona o IA) están en `AGENTS.md`.
