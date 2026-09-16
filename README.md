# Horas · Devocionario

Devocionario católico personal (PWA): ofrecimiento de la mañana, Completas de cada día de la semana y la Santa Misa explicada paso a paso. Se instala en el móvil como una app normal y funciona sin conexión.

## Versión 2.1 · experiencia móvil

- Nueva interfaz marfil e índigo, con cruz latina sencilla e iconos opacos.
- Navegación inferior: Hoy, Oraciones y Ajustes.
- Biblioteca con búsqueda sin tildes y favoritos persistentes por oración y formulario.
- Índice siempre visible durante la lectura, con anterior y siguiente.
- Selección del formulario semanal de Completas, controles amplios y paneles accesibles.
- Se conservan preferencias, seguimiento diario y posición de lectura. La guía de Misa se marca como leída.
- Los textos de oración de la versión publicada no se han modificado. Completas sigue siendo un devocionario personal, no una edición oficial íntegra verificada.

Los cambios del borrador editorial local anterior se conservan en su carpeta original y no forman parte de esta publicación.

Comprobación de los flujos móviles: `node tests/mobile.cjs` (requiere Playwright). Generación de iconos: `node scripts/build-icons.cjs` (requiere Sharp).

## Versión 2.0 · anterior

- Nuevo icono católico sencillo: una cruz latina moderna en marfil sobre azul noche.
- Seguimiento diario de Mañana, Misa y Completas, guardado solo en el dispositivo.
- Accesos directos desde el icono de la app a cada momento de oración.
- Cambio de día corregido para sesiones largas y fechas calculadas en hora local.
- Mejoras de accesibilidad en paneles, explicaciones y progreso de lectura.
- Actualización más fiable de la PWA sin perder el modo sin conexión.

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
- **Ritmo de hoy**: permite marcar cada momento como rezado y muestra el avance del día sin rachas ni puntuaciones.
- **Índice deslizable** con la parte actual resaltada mientras lees, y salto directo a otro momento del día sin pasar por la portada.
- **Tres temas** (papel, sepia y noche) y tamaño de letra ajustable, con la preferencia recordada.
- **Pantalla siempre encendida** mientras rezas, si el móvil lo permite.
- **Sin conexión**: todo el contenido, las tipografías y los iconos quedan guardados en el móvil.
- El botón atrás de Android cierra el índice o vuelve a la portada, no sale de la app.

## Diseño

Interfaz móvil en marfil `#F6F5F1` e índigo `#514887`, con icono en `#393354`. Cardo para todo lo que se reza, IBM Plex Sans para la interfaz (rótulos, botones, datos). Los versos van con sangría francesa: si una línea no cabe en el ancho del móvil, su continuación queda entrada en vez de parecer un verso nuevo.

Las tipografías van recortadas a los caracteres que realmente usa el devocionario: 84 KB las seis fuentes juntas.

## Estructura

```
index.html      estructura de la app
style.css       sistema visual y componentes
mobile.css      interfaz móvil, biblioteca y controles de lectura
app.js          lógica: navegación, índice, ajustes, progreso
data.js         el contenido: oraciones, Completas y la Misa
manifest.json   metadatos de instalación
sw.js           service worker (caché offline)
fonts/          Cardo (3) e IBM Plex Sans (3), en woff2 recortado
icons/          iconos de la app
```

Para cambiar un texto, edita `data.js`: es JSON, cada parte tiene `n` (número), `t` (título), `c` (lo que se reza) y `r` (la explicación). Si añades o quitas partes no hace falta tocar nada más; el índice y los tiempos se calculan solos.

Al subir cambios, sube también el número de versión en la primera línea de `sw.js` (`horas-v3` → `horas-v4`) para que los móviles ya instalados recojan la versión nueva.
