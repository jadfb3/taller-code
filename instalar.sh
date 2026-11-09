#!/usr/bin/env bash
# Taller Code - instalador para Linux.
#
#   Con una línea (descarga, instala y arranca):
#     curl -fsSL https://raw.githubusercontent.com/jadfb3/taller-code/main/instalar.sh | bash
#
#   Desde el zip descomprimido (se instala en ~/taller-code; la carpeta de Descargas se puede borrar):
#     bash instalar.sh
#
#   Opciones:  --sin-arranque   no crear el arranque automático al prender la PC
#              --quitar         quita el arranque automático y el acceso directo
#                               (no borra la carpeta ni tus datos)
set -u

URL_ZIP="${TALLER_URL_ZIP:-https://github.com/jadfb3/taller-code/archive/refs/heads/main.zip}"
DESTINO="${TALLER_DESTINO:-$HOME/taller-code}"
SERVICIO="taller-code.service"
UNIDAD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
SIN_ARRANQUE=0; QUITAR=0
for a in "$@"; do
  case "$a" in
    --sin-arranque) SIN_ARRANQUE=1 ;;
    --quitar) QUITAR=1 ;;
  esac
done

di()  { printf '%s\n' "$*"; }
falla() { printf '\nNo pude continuar: %s\n' "$*" >&2; exit 1; }

if [ "$(uname -s)" != "Linux" ]; then
  falla "este instalador es solo para Linux. En Mac o Windows abre una terminal en la carpeta y escribe: node server.js"
fi

# ---- quitar ----
if [ "$QUITAR" = 1 ]; then
  systemctl --user disable --now "$SERVICIO" >/dev/null 2>&1
  rm -f "$UNIDAD_DIR/$SERVICIO" "$APPS_DIR/taller-code.desktop"
  systemctl --user daemon-reload >/dev/null 2>&1
  di "Listo: quité el arranque automático y el acceso directo. La carpeta y tus datos siguen donde estaban."
  exit 0
fi

# ---- Node ----
NODE="$(command -v node || true)"
[ -n "$NODE" ] || falla "falta Node.js. Instálalo desde https://nodejs.org (versión 18 o superior) y vuelve a correr este comando."
VER="$("$NODE" -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
[ "$VER" -ge 18 ] 2>/dev/null || falla "tu Node es muy viejo (v$VER). Necesitas la versión 18 o superior: https://nodejs.org"

# ---- ubicar el programa: carpeta descomprimida o descarga directa ----
ORIGEN=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "$(dirname "${BASH_SOURCE[0]}")/server.js" ]; then
  ORIGEN="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [ -z "$ORIGEN" ]; then
  di "Descargando Taller Code..."
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  curl -fsSL "$URL_ZIP" -o "$TMP/t.zip" || falla "no pude descargar $URL_ZIP (¿hay internet?)."
  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$TMP/t.zip" -d "$TMP/x" || falla "no pude descomprimir la descarga."
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$TMP/t.zip" "$TMP/x" || falla "no pude descomprimir la descarga."
  else
    falla "falta 'unzip'. Instálalo con: sudo apt install unzip"
  fi
  ORIGEN="$(find "$TMP/x" -maxdepth 2 -name server.js -printf '%h\n' | head -1)"
  [ -n "$ORIGEN" ] || falla "la descarga no trae server.js."
fi

# Siempre se instala en $DESTINO, así la carpeta de Descargas se puede borrar.
# Si ya estaba instalado, se actualiza sin tocar tus datos, tu llave ni tu config.
CARPETA="$DESTINO"
if [ "$(cd "$ORIGEN" && pwd)" != "$(mkdir -p "$CARPETA" && cd "$CARPETA" && pwd)" ]; then
  for f in "$ORIGEN"/* "$ORIGEN"/.[!.]*; do
    [ -e "$f" ] || continue
    n="$(basename "$f")"
    case "$n" in datos|.env|config.json) [ -e "$CARPETA/$n" ] && continue ;; esac
    case "$n" in *.antes_*|taller-code.zip) continue ;; esac
    cp -r "$f" "$CARPETA/"
  done
fi
di "Instalado en: $CARPETA"

# ---- puerto libre ----
PUERTO="$("$NODE" -e '
const fs=require("fs"),net=require("net"),p=process.argv[1]+"/config.json";
let c={};try{c=JSON.parse(fs.readFileSync(p,"utf8"))}catch{}
let n=Number(c.puerto)||4321;
// Si ya hay un servicio de Taller instalado en este mismo puerto, se queda igual.
const libre=(x)=>new Promise(r=>{const s=net.createServer().once("error",()=>r(false)).once("listening",()=>s.close(()=>r(true))).listen(x,"127.0.0.1")});
(async()=>{
  const reinst=process.argv[2]==="1";
  let q=n;
  if(!reinst) while(!(await libre(q))&&q<n+50) q++;
  if(q!==c.puerto){c.puerto=q;fs.writeFileSync(p,JSON.stringify(c,null,2)+"\n")}
  console.log(q);
})();
' "$CARPETA" "$(systemctl --user is-active "$SERVICIO" >/dev/null 2>&1 && echo 1 || echo 0)")"

# ---- arranque automático (systemd de usuario, sin sudo) ----
ARRANQUE="no"
if [ "$SIN_ARRANQUE" = 0 ] && command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
  mkdir -p "$UNIDAD_DIR"
  cat > "$UNIDAD_DIR/$SERVICIO" <<EOF
[Unit]
Description=Taller Code
After=network.target

[Service]
WorkingDirectory=$CARPETA
ExecStart=$NODE $CARPETA/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  if systemctl --user enable "$SERVICIO" >/dev/null 2>&1 && systemctl --user restart "$SERVICIO" >/dev/null 2>&1; then
    ARRANQUE="si"
  fi
fi

# ---- acceso directo en el menú de aplicaciones ----
mkdir -p "$APPS_DIR"
cat > "$APPS_DIR/taller-code.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Taller Code
Comment=Abrir Taller Code en el navegador
Exec=xdg-open http://127.0.0.1:$PUERTO
Terminal=false
Categories=Development;
EOF

# ---- resumen ----
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
di ""
di "================ Taller Code instalado ================"
if [ "$ARRANQUE" = "si" ]; then
  sleep 1
  di "Arranca solo cada vez que prendas la PC (ya está corriendo)."
  di ""
  di "En esta PC, abre:   http://127.0.0.1:$PUERTO"
else
  di "No quedó con arranque automático. Para usarlo, en una terminal:"
  di "   cd $CARPETA && node server.js"
  di ""
  di "Luego abre:   http://127.0.0.1:$PUERTO"
fi
di ""
di "Teléfono: por defecto solo se abre desde esta PC (más seguro)."
di "Para usarlo desde el celular en tu WiFi, pon  \"red\": true  en $CARPETA/config.json"
[ -n "$IP" ] && di "y abre en el celular:  http://$IP:$PUERTO   (pide una clave; está en $CARPETA/datos/acceso.json)"
di ""
di "Para quitar el arranque automático:  bash $CARPETA/instalar.sh --quitar"
di "========================================================"
