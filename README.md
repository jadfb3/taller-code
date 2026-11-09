# Taller Code

Interfaz local para trabajar con un agente de programación usando **cualquier modelo de OpenRouter**. Lee tu código, propone cambios y **no aplica nada hasta que tú lo apruebas** (y antes guarda una copia del archivo).

Hecho por un desarrollador independiente en Venezuela.

## Instalar (Linux)

Necesitas **Node.js 18 o superior** ([nodejs.org](https://nodejs.org)).

**1.** Descarga [`taller-code.zip`](https://github.com/jadfb3/taller-code/releases/latest/download/taller-code.zip) (un clic, se baja solo) y déjalo en tu carpeta **Descargas**.

**2.** Pega este comando en una terminal:

```
cd ~/Descargas && unzip taller-code.zip && cd taller-code && bash instalar.sh
```

**3.** Abre la dirección que te muestra al final (normalmente <http://127.0.0.1:4321>).

Listo: queda instalado en `~/taller-code` y **arranca solo cada vez que prendas la PC**. La carpeta de Descargas ya se puede borrar.

## Primer uso

1. Pega tu **llave de OpenRouter** ([openrouter.ai/keys](https://openrouter.ai/keys), con un límite de gasto) en *Llave de OpenRouter* y pulsa *Guardar*.
2. Pega la ruta de tu proyecto en el chat (por ejemplo `/home/tu_usuario/mi_app`) y pulsa Enter.
3. Pídele un cambio. Te lo muestra con **Antes / Después** y tú decides: *Aprobar* o *Rechazar*.

## Actualizar

Baja el `taller-code.zip` nuevo a Descargas y pega el mismo comando del paso 2. Tus chats, tu llave y tu configuración se conservan.

## Útiles

**IP y puertos** (para abrirlo desde el celular):
```
hostname -I | awk '{print $1}'; ss -ltnp | grep -E 'node|MainThread'
```

**¿Está corriendo?**
```
systemctl --user status taller-code --no-pager | head -5
```

**Si no abre, ver el error:**
```
journalctl --user -u taller-code -n 20 --no-pager
```

**Reiniciar:**
```
systemctl --user restart taller-code
```

**Quitar el arranque automático:**
```
bash ~/taller-code/instalar.sh --quitar
```

Mac, Windows, el celular, varios proyectos y todo lo demás: **[manual completo](MANUAL.md)**.

## Licencia

MIT. Ver [LICENSE](LICENSE).
