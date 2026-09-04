# Horas · Devocionario

App de oración personal (PWA): ofrecimiento de la mañana, Completas de cada día de la semana y la Misa explicada paso a paso. Funciona sin conexión y se instala en el móvil como una app normal.

## Publicar en GitHub Pages

**Opción rápida (sin usar la terminal):**

1. Entra en [github.com](https://github.com) → botón verde **New** → crea un repositorio, por ejemplo `horas`. Puede ser público o privado (con privado también funciona GitHub Pages).
2. Dentro del repo, botón **Add file → Upload files**. Arrastra *todos* los archivos y carpetas de esta entrega (`index.html`, `style.css`, `app.js`, `data.js`, `manifest.json`, `sw.js`, la carpeta `fonts` y la carpeta `icons`) manteniendo la misma estructura. Confirma con **Commit changes**.
3. Ve a **Settings → Pages**. En "Build and deployment" elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
4. Espera 1-2 minutos. GitHub te dará la URL, algo como `https://tu-usuario.github.io/horas/`.

**Opción con git (si lo usas normalmente):**

```bash
git init
git add .
git commit -m "Horas: devocionario"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/horas.git
git push -u origin main
```

Luego activa Pages igual que en el paso 3 de arriba.

## Instalar en el móvil

Abre la URL de GitHub Pages en el navegador del móvil.

- **Android (Chrome):** aparecerá un aviso para "Instalar app" o "Añadir a pantalla de inicio"; si no aparece, toca el menú (⋮) → **Instalar aplicación**.
- **iPhone (Safari):** toca el icono de compartir (□↑) → **Añadir a pantalla de inicio**.

Una vez instalada, abre y cierra la app con conexión al menos una vez para que quede guardada offline; después funcionará sin datos ni wifi.

## Qué ha cambiado respecto a la versión anterior

- Rediseño completo con tu sistema visual "Tinta de noche" (papel, tinta, acero y burdeos) y tipografía Cardo, en vez del tema oscuro anterior.
- App instalable de verdad: `manifest.json` + service worker, con iconos propios. Antes solo tenía metaetiquetas sueltas y no se podía instalar como app offline.
- Funciona sin conexión desde la primera visita en adelante (todo el contenido, tipografías e iconos quedan cacheados).
- Índice deslizable (☰) para saltar directamente a cualquier oración, oficio de Completas o parte de la Misa sin hacer scroll.
- Modo claro/oscuro y control de tamaño de letra, con preferencia recordada.
- "Continuar donde lo dejaste": si sales a mitad de una oración, la portada te ofrece retomarla en el mismo punto.
- Peso mucho menor: las tipografías van en 3 archivos `.woff2` recortados a los caracteres que realmente usas (antes iban incrustadas en base64 dentro del propio HTML, ~180 KB solo de fuente).
- Mismo contenido exacto de tus oraciones, Completas (las 7 variantes semanales) y la explicación de la Misa: no se ha tocado ni un texto, solo la presentación.

## Estructura de archivos

```
index.html      página principal
style.css       estilos
app.js          lógica de la app
data.js         tus oraciones, Completas y la Misa (contenido)
manifest.json   metadatos de instalación
sw.js           service worker (caché offline)
fonts/          Cardo (regular, cursiva, negrita) en woff2
icons/          iconos de la app
```

Para cambiar cualquier texto de las oraciones, edita `data.js` (es JSON: busca el título y modifica el campo `"c"` para el texto de la oración o `"r"` para la explicación).
