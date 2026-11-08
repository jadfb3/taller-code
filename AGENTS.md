# Reglas para modificar Taller Code

Taller Code es una interfaz local (Node.js, sin dependencias) para trabajar con un agente de programación vía OpenRouter. Esta carpeta es el programa mismo. Quien lo modifique (persona o IA) debe seguir estas reglas.

## Estructura
- `server.js`: todo el servidor (rutas, herramientas del agente, llamadas a OpenRouter, seguridad).
- `public/index.html`: toda la interfaz (HTML, CSS y JavaScript en un solo archivo).
- `config.json`: puerto, carpetas permitidas (`raices`), modelos favoritos, instrucciones opcionales.
- `pruebas/prueba.js`: pruebas automáticas.
- `.env` (llave de OpenRouter) y `datos/` (chats, proyectos, clave de red): **nunca se leen, se editan ni se suben a ningún lado**.

## Antes de dar por terminado un cambio
1. Corre `node pruebas/prueba.js` (desde esta carpeta; necesita los puertos 4998 y 4999 libres). Debe terminar con `TODAS LAS PRUEBAS PASARON`.
2. Si cambiaste comportamiento, agrega una prueba nueva para eso.
3. Revisa la sintaxis del JavaScript de `public/index.html`.

## Lo que NO se puede romper (seguridad)
- El agente solo ve el proyecto abierto: rutas validadas, sin salirse de la carpeta, sin seguir enlaces simbólicos hacia afuera.
- Archivos secretos bloqueados (`.env*`, `key.properties`, `*.jks`, `*.keystore`, `*.p12`, `*.pem`, `*.key`, cuentas de servicio, claves SSH).
- Ningún cambio a archivos del usuario se aplica sin su aprobación. Al aprobar: se revalida, se hace copia `archivo.antes_<fecha>`, se escribe y se verifica.
- Varias propuestas por turno (editar/crear_archivo); el usuario las aprueba una por una o con "Aprobar todo". Un solo comando pendiente por turno.
- **Autonomía** (decidida por el dueño del proyecto): `no` = todo con clic; `lectura` = solo comandos de la lista `COMANDOS_SEGUROS` (`esComandoSeguro`: sin `; > < & $( tee --output`, sin `find -delete/-exec`) corren solos; `total` = además editar y crear_archivo se aplican solos (con copia). Comandos que cambian algo y apps NUNCA se aprueban solos (salvo `autoAprobar` explícito de cada app). No ampliar `COMANDOS_SEGUROS` con nada que escriba archivos fuera de carpetas de compilación.
- Web: `leer_web` bloquea IPs privadas/locales y protocolos que no sean http(s) (anti-SSRF), revisando cada redirección. `buscar_web` usa el plugin web de OpenRouter.
- `captura` solo fotografía `.html` del proyecto a través de `/ver/` (sandbox sin acceso a la API).
- `delegar`: ayudantes con herramientas de SOLO lectura (`HERR_AYUDANTE`); nunca darles editar, comando, apps ni delegar.
- `recordar` rechaza llaves y contraseñas; la memoria (datos/memoria.md) máximo 8 KB.
- Apps (MCP stdio en `config.json` → `apps`): cada llamada pide aprobación salvo `autoAprobar`; reciben el entorno reducido (sin la llave de OpenRouter); sus secretos van en `.env` como `$VARIABLE`.
- Terminal: la única vía es la herramienta `comando`: PROPONE, el usuario pulsa Permitir una vez, corre en la carpeta del proyecto sin stdin, con tiempo límite, entorno reducido (sin la llave) y revisión previa (`revisarComando`). Solo se aprueba desde la propia PC salvo `"comandosDesdeRed": true`. No agregar otra vía de ejecución ni relajar esas reglas sin una decisión explícita del dueño del proyecto; toda regla nueva lleva prueba.
- Los POST exigen la cabecera `X-Taller: 1` y el Host debe ser local (o IP privada en modo red).
- Modo red (`TALLER_RED=1`): exige clave, bloquea tras 5 intentos fallidos, solo IP privadas. No debilitarlo.
- Cada proyecto de un chat sigue encerrado en su propia carpeta; cada propuesta lleva el nombre de su proyecto.
- Sin dependencias externas: solo Node 18+. No agregar paquetes.

## Estilo
- Textos de la interfaz en español, claros y cortos. Sin datos ni nombres personales en el código ni en los textos.
- Un solo archivo de servidor y uno de interfaz. No dividir en muchos archivos.
- Cambios mínimos: tocar solo lo pedido.

- Imágenes: guardar_imagen solo PROpone guardar una imagen adjunta en el proyecto; el usuario aprueba viendo la imagen. Valida formato real (png/jpg/webp/gif), extensión, máximo 5 MB, la jaula del proyecto y que no exista el archivo. No relajar estas reglas sin decisión explícita del usuario.

- `charla/` es la carpeta neutral y vacía para chatear sin proyecto. `validarProyecto` la acepta aunque no esté en las raíces; no es un proyecto real ni da acceso a otras rutas. No ampliar esa excepción ni guardar archivos ahí sin decisión explícita.

- **Nuevo chat** abre siempre la charla libre (sin ruta ni acceso a carpetas); el botón `+` junto al nombre del proyecto abierto crea un chat nuevo dentro de ese proyecto.

- **Personalidad** (Ajustes): texto en `datos/personalidad.md` que se manda a todos los modelos y manda sobre el tono; si el archivo no existe se usa `PERSONALIDAD_BASE` de server.js; vacío = apagada. No sustituye las reglas de aprobación.

- **Memoria que aprende** (server.js, bloque "Memoria que aprende sola"): tras cada 4 mensajes tuyos nuevos y al empezar un chat nuevo, un modelo (config `modeloMemoria`, si no el del chat) propone agregar/reemplazar/borrar notas de `datos/memoria.md`; los cambios se anotan en `datos/memoria.log` y se ven en Ajustes. Se apaga con `"memoriaAuto": false` en config.json; `memoriaCada` cambia el umbral. `recordar` acepta `reemplaza` para sustituir una nota. Nunca guarda claves.
- El repaso de memoria también lee los cambios aprobados y aplicados (avisos del sistema) para notar cambios de rumbo; el modelo propone actualizar el AGENTS.md del proyecto cuando cambia la arquitectura.
- `llamarModelo` reintenta hasta 2 veces (espera 1,5 s y 3 s) ante 408/429/502/503/504 o corte de red antes de recibir texto, avisando en el chat; los demás errores (401, 402...) salen de una vez.

- Skins: temas por variables CSS ([data-tema] en <html>, localStorage skinTema/skinCss), caja de CSS propio (bloquea @import/url externa), "Quitar skin" y ?sinskin=1 siempre restauran el diseño. Todo acento sale de --accent/--accent2/--lima; no pongas verdes fijos en el CSS.
