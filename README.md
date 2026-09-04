# Horas · Devocionario

App de oración personal (PWA): ofrecimiento de la mañana, Completas de cada día de la semana y la Misa explicada paso a paso. Se instala en el móvil como una app normal y funciona sin conexión.

## Publicar en GitHub Pages

**Sin usar la terminal:**

1. En [github.com](https://github.com), botón verde **New** → crea el repositorio, por ejemplo `horas`. Público o privado, los dos valen.
2. **Add file → Upload files**. Arrastra todos los archivos y las carpetas `fonts` e `icons` manteniendo la estructura. **Commit changes**.
3. **Settings → Pages** → "Build and deployment" → **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guardar.
4. En 1-2 minutos tendrás la URL: `https://tu-usuario.github.io/horas/`.

**Con git:**

```bash
git init
git add .
git commit -m "Horas: devocionario"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/horas.git
git push -u origin main
```

Después activa Pages igual que en el paso 3.

## Instalar en el móvil

Abre la URL en el navegador del móvil.

- **Android (Chrome):** aparece el aviso "Instalar aplicación", o desde el menú ⋮ → **Instalar aplicación**. La app también muestra un botón "Instalar en el móvil" en la portada cuando el navegador lo permite.
- **iPhone (Safari):** icono de compartir (□↑) → **Añadir a pantalla de inicio**.

Ábrela una vez con conexión para que se guarde entera; a partir de ahí funciona sin datos ni wifi.

## Qué hace la app

- **Tres momentos**: Mañana (8 oraciones), Completas con las siete variantes de la semana (la del día se abre sola) y la Misa explicada en 14 partes.
- **Entender**: el botón ¶ despliega, junto a cada parte, qué es y de dónde viene lo que se está rezando.
- **Ahora**: la portada marca el momento que toca según la hora del día.
- **Continuar**: si sales a mitad de una oración, la portada te ofrece volver al punto exacto.
- **Índice deslizable** con la parte actual resaltada mientras lees, y salto directo a otro momento del día sin pasar por la portada.
- **Tres temas** (papel, sepia y noche) y tamaño de letra ajustable, con la preferencia recordada.
- **Pantalla siempre encendida** mientras rezas, si el móvil lo permite.
- **Sin conexión**: todo el contenido, las tipografías y los iconos quedan guardados en el móvil.
- El botón atrás de Android cierra el índice o vuelve a la portada, no sale de la app.

## Diseño

Sistema visual propio: papel `#F7F5F0`, tinta `#16233A` y burdeos `#6B2735`. Cardo para todo lo que se reza, IBM Plex Sans para la interfaz (rótulos, botones, datos). Los versos van con sangría francesa: si una línea no cabe en el ancho del móvil, su continuación queda entrada en vez de parecer un verso nuevo.

Las tipografías van recortadas a los caracteres que realmente usa el devocionario: 84 KB las seis fuentes juntas.

## Estructura

```
index.html      estructura de la app
style.css       sistema visual y componentes
app.js          lógica: navegación, índice, ajustes, progreso
data.js         el contenido: oraciones, Completas y la Misa
manifest.json   metadatos de instalación
sw.js           service worker (caché offline)
fonts/          Cardo (3) e IBM Plex Sans (3), en woff2 recortado
icons/          iconos de la app
```

Para cambiar un texto, edita `data.js`: es JSON, cada parte tiene `n` (número), `t` (título), `c` (lo que se reza) y `r` (la explicación). Si añades o quitas partes no hace falta tocar nada más; el índice y los tiempos se calculan solos.

Al subir cambios, sube también el número de versión en la primera línea de `sw.js` (`horas-v3` → `horas-v4`) para que los móviles ya instalados recojan la versión nueva.
