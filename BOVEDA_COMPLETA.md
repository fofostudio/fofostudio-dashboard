# 📂 Bóveda de Contenido Completa

## Visión General

La Bóveda de Contenido es ahora un **explorador completo** del Google Drive de FofoStudio que:

1. **Escanea recursivamente** todo el contenido desde la carpeta root
2. **Detecta automáticamente** dimensiones y aspect ratio de imágenes/videos
3. **Recomienda tipo de post** según aspect ratio
4. **Cross-referencia** con el calendario para mostrar qué assets están en uso
5. **Permite crear publicaciones** directamente desde cualquier asset disponible

---

## 🎯 Características Principales

### 1. Exploración Recursiva del Drive

**Carpeta Root:** `101aDQpLF84Kfln7fwoPexKa1MPhZBHpz`

- ✅ Lee **todas** las carpetas y subcarpetas
- ✅ Extrae metadata completa de cada archivo
- ✅ Calcula aspect ratio automáticamente
- ✅ Genera thumbnails optimizados

**Estructura típica escaneada:**
```
FofoStudio Root/
├── Social Pieces/
│   ├── 2026-03-03/
│   ├── 2026-03-10/
│   └── ...
├── Logos/
├── Photos/
├── References/
└── Exports/
```

### 2. Detección de Aspect Ratio

**Ratios detectados automáticamente:**

| Ratio | Valor | Recomendación |
|-------|-------|---------------|
| 1:1 | 1.0 | 📱 Feed Post |
| 4:5 | 0.8 | 📱 Feed Post |
| 9:16 | 0.5625 | 📲 Historia |
| 16:9 | 1.7778 | 🎬 Reel |
| 3:4 | 0.75 | 📱 Feed Post |
| 4:3 | 1.3333 | 📱 Feed Post |

**Lógica de recomendación:**
- El sistema encuentra el ratio más cercano a las dimensiones reales
- Sugiere el tipo de post óptimo según buenas prácticas de redes sociales
- Muestra el ratio y recomendación visualmente en cada tarjeta

### 3. Estados de Assets

**Indicadores visuales:**

🟢 **En Calendario** (verde)
- El asset está asociado a un post programado
- Muestra título y fecha del post
- Click para ver detalles del post asociado

🔵 **Disponible** (azul)
- Asset sin usar en calendario
- Hover revela botón "Crear Publicación"
- Listo para programación rápida

### 4. Creación Rápida de Posts

**Workflow:**

1. **Hover sobre asset disponible** → Aparece botón "Crear Publicación"
2. **Click en botón** → Modal con formulario pre-poblado:
   - ✅ Fecha (default: hoy)
   - ✅ Hora (default: 12:00)
   - ✅ Tipo (pre-seleccionado según aspect ratio)
   - ✅ Plataforma (default: ambas)
   - ✅ Título/mensaje
   - ✅ Descripción adicional
3. **Submit** → Post creado en Google Sheets
4. **Auto-actualización** → Calendario y Bóveda se refrescan

---

## 🛠️ Implementación Técnica

### Backend: `/assets` Endpoint

**Archivo:** `netlify/functions/assets.js`

**Funciones principales:**

```javascript
// Exploración recursiva
async function getAllFilesRecursive(drive, folderId, path = '')

// Cross-reference con calendario
async function getCalendarPosts(accessToken)

// Cálculo de aspect ratio
function calculateAspectRatio(width, height)

// Recomendación de tipo
function recommendPostType(aspectRatio)
```

**Respuesta del endpoint:**

```json
{
  "assets": [
    {
      "id": "1abc...",
      "name": "promo-feed.jpg",
      "path": "Social Pieces/2026-03-03/promo-feed.jpg",
      "type": "image",
      "size": "2.3 MB",
      "sizeBytes": 2411520,
      "created": "2026-03-03T10:30:00Z",
      "url": "https://lh3.googleusercontent.com/d/1abc...",
      "thumbnail": "https://lh3.googleusercontent.com/d/1abc...",
      "aspectRatio": "4:5",
      "recommendedType": "feed",
      "width": 1080,
      "height": 1350,
      "usedInCalendar": false,
      "postId": null,
      "postTitle": null,
      "postDate": null
    },
    {
      "id": "2def...",
      "name": "historia-ofertas.jpg",
      "path": "Social Pieces/2026-03-03/historia-ofertas.jpg",
      "type": "image",
      "size": "1.8 MB",
      "sizeBytes": 1887436,
      "created": "2026-03-03T11:00:00Z",
      "url": "https://lh3.googleusercontent.com/d/2def...",
      "thumbnail": "https://lh3.googleusercontent.com/d/2def...",
      "aspectRatio": "9:16",
      "recommendedType": "story",
      "width": 1080,
      "height": 1920,
      "usedInCalendar": true,
      "postId": "post-45",
      "postTitle": "Ofertas del día 🔥",
      "postDate": "2026-03-05"
    }
  ],
  "total": 127,
  "used": 45,
  "available": 82
}
```

### Backend: `/create-post-from-asset` Endpoint

**Archivo:** `netlify/functions/create-post-from-asset.js`

**Función:** Crea un nuevo post en Google Sheets desde un asset

**Request body:**

```json
{
  "assetId": "1abc...",
  "assetUrl": "https://lh3.googleusercontent.com/d/1abc...",
  "assetName": "promo-feed.jpg",
  "date": "2026-03-10",
  "time": "14:00",
  "title": "¡Nueva promoción disponible!",
  "description": "Visita nuestra clínica hoy mismo",
  "type": "feed",
  "platform": "both"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "date": "2026-03-10",
    "time": "14:00",
    "title": "¡Nueva promoción disponible!",
    "description": "Visita nuestra clínica hoy mismo",
    "type": "feed",
    "platform": "both",
    "image_url": "https://lh3.googleusercontent.com/d/1abc..."
  },
  "updatedRange": "Calendario Marzo 2026!A67"
}
```

### Frontend: Renderizado de Assets

**Archivo:** `public/app.js`

**Funciones principales:**

```javascript
// Renderizado de grid con estados
function renderAssets(assets)

// Modal de detalle
function showAssetDetail(assetId, assetData)

// Modal de creación
function openCreatePostModal(assetId, assetName, assetUrl, recommendedType, aspectRatio)

// Submit de creación
async function handleCreatePostSubmit(event, assetId, assetUrl, assetName)
```

**Elementos visuales:**

1. **Badge de estado** (esquina superior izquierda)
   - Verde: "En Calendario"
   - Azul: "Disponible"

2. **Badge de aspect ratio** (esquina superior derecha)
   - Muestra ratio detectado (ej: "4:5", "9:16")

3. **Badge de tipo recomendado** (dentro de asset-info)
   - Color según tipo:
     - 🧡 Naranja: Feed
     - 💜 Púrpura: Story
     - 💗 Rosa: Reel
     - 💙 Azul: Carrusel

4. **Botón flotante** (hover sobre asset disponible)
   - Aparece desde abajo con animación suave
   - Gradiente naranja brand
   - Texto: "+ Crear Publicación"

---

## 🎨 Estilos CSS

**Archivo:** `public/styles.css`

**Clases principales:**

```css
/* Estados de assets */
.asset-card { position: relative; }
.asset-card.used { border-color: rgba(34, 197, 94, 0.3); }
.asset-card.available { /* default */ }

/* Badges */
.asset-status { /* esquina superior izquierda */ }
.asset-status.in-calendar { background: green gradient; }
.asset-status.available { background: blue gradient; }

.asset-aspect-badge { /* esquina superior derecha */ }

.asset-recommended-type { /* dentro de info */ }
.asset-recommended-type.feed { /* naranja */ }
.asset-recommended-type.story { /* púrpura */ }
.asset-recommended-type.reel { /* rosa */ }
.asset-recommended-type.carousel { /* azul */ }

/* Botón flotante */
.asset-create-btn {
  position: absolute;
  bottom: 0;
  opacity: 0;
  transform: translateY(100%);
  transition: all 0.3s ease;
}

.asset-card:hover .asset-create-btn {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 🚀 Uso

### Ver Todos los Assets

1. Ve a la pestaña **"Bóveda de Contenido"**
2. El sistema carga automáticamente todos los assets del Drive
3. Scroll para explorar todo el contenido

**Stats mostrados:**
- Total de assets
- Assets en uso (en calendario)
- Assets disponibles

### Filtrar Assets (opcional)

El filtro dropdown aún funciona para reducir scope:
- **All** - Todo el Drive (default)
- **Feed** - Solo imágenes para feed
- **Stories** - Solo contenido vertical
- **Logos** - Carpeta de logos
- **Photos** - Carpeta de fotos

### Crear Post desde Asset

**Opción 1: Hover directo**
1. Pasa el mouse sobre un asset **disponible**
2. Aparece botón "+ Crear Publicación"
3. Click → Modal de creación
4. Llena formulario (pre-poblado inteligentemente)
5. Submit → Post creado automáticamente

**Opción 2: Detalle completo**
1. Click en cualquier asset → Modal de detalle
2. Ver metadata completa:
   - Dimensiones (width × height)
   - Aspect ratio detectado
   - Tipo recomendado
   - Estado (en calendario o disponible)
   - Tamaño de archivo
3. Si disponible: botón "Crear Publicación con este Asset"
4. Si en uso: muestra post asociado con fecha

### Asociación Automática

El sistema **cross-referencia** automáticamente:

```javascript
// Compara URL de asset con URL en posts del calendario
const usedInPost = calendarPosts.find(post => 
  post.image_url && asset.url && post.image_url.includes(asset.id)
);
```

**Ventajas:**
- ✅ Evita duplicados visuales
- ✅ Rastrea uso de assets
- ✅ Facilita reutilización estratégica
- ✅ Identifica assets sin usar

---

## 📊 Casos de Uso

### 1. Auditoría de Assets

**Pregunta:** "¿Cuántos assets tengo sin usar?"

**Respuesta:**
- Ve a Bóveda
- Stats en la parte superior muestran:
  - Total: 127 assets
  - En uso: 45 assets
  - Disponibles: 82 assets

### 2. Programación Rápida

**Escenario:** Tienes una imagen lista y quieres programarla rápido

**Workflow:**
1. Abre Bóveda
2. Busca la imagen (visual scroll)
3. Hover → "+ Crear Publicación"
4. Formulario ya sugiere tipo según aspect ratio
5. Agrega título/copy
6. Submit → Listo en 30 segundos

### 3. Reutilización Estratégica

**Escenario:** Quieres reutilizar una imagen vieja en un nuevo post

**Workflow:**
1. Abre Bóveda
2. Encuentra imagen (puede estar marcada "En Calendario")
3. Click → Ver detalle
4. Verifica post original
5. Decide si crear variación o nuevo post

### 4. Control de Dimensiones

**Escenario:** Necesitas una imagen 9:16 para story

**Workflow:**
1. Abre Bóveda
2. Scroll visual identificando badges de aspect ratio
3. Busca "9:16" en esquina superior derecha
4. Click → Crear story

---

## 🔧 Configuración Requerida

### Variables de Entorno (Netlify)

```bash
# Google OAuth (ya configuradas)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://f0f0stud1od4shb0ard4ds.netlify.app

# Google Sheets
GOOGLE_SPREADSHEET_ID=18FoN5iiPFMX_h0BqIc8KvpS6y-qmd7aKK_pZtDwQUdg
```

### Carpeta Root del Drive

Hardcoded en `assets.js`:

```javascript
const rootFolderId = '101aDQpLF84Kfln7fwoPexKa1MPhZBHpz';
```

**Para cambiar:** Edita esta línea en `netlify/functions/assets.js`

---

## 🐛 Troubleshooting

### Assets no aparecen

**Posibles causas:**
1. OAuth token expirado → Cierra sesión y vuelve a iniciar
2. Permisos de Drive insuficientes → Verifica OAuth scopes incluyan `drive.readonly`
3. Error de red → Revisa Netlify Function logs

**Fix:**
```bash
# Ver logs de la función
netlify functions:log assets
```

### Aspect ratio incorrecto

**Causa:** Imagen sin metadata EXIF

**Fix:** El sistema usa dimensiones reportadas por Google Drive API. Si son incorrectas:
1. Re-sube la imagen a Drive
2. O edita manualmente en código la lógica de `calculateAspectRatio()`

### Post creado pero no aparece en calendario

**Causa:** Nombre de hoja incorrecto en `create-post-from-asset.js`

**Fix:**
```javascript
// Cambiar nombre de hoja si es diferente
const sheetName = 'Calendario Marzo 2026'; // ← Editar aquí
```

### Botón "Crear Publicación" no aparece en hover

**Causa:** Asset ya está en calendario

**Verificación:**
- Badge debe decir "Disponible" (azul)
- Si dice "En Calendario" (verde), no mostrará botón
- Click en asset → Ver detalle para confirmar estado

---

## 📈 Métricas y Analytics

### Stats Disponibles

La respuesta del endpoint incluye:

```json
{
  "total": 127,      // Total de assets en Drive
  "used": 45,        // Assets asociados a posts
  "available": 82    // Assets sin usar
}
```

**Uso futuro:**
- Calcular tasa de utilización: `(used / total) * 100`
- Identificar assets obsoletos (creados hace >90 días sin usar)
- Optimizar almacenamiento (remover assets duplicados)

---

## 🎯 Roadmap

### Features Planeadas

1. **Búsqueda y filtros avanzados**
   - Buscar por nombre de archivo
   - Filtrar por fecha de creación
   - Filtrar por aspect ratio específico
   - Filtrar por estado (usado/disponible)

2. **Bulk operations**
   - Selección múltiple de assets
   - Crear múltiples posts a la vez
   - Mover assets entre carpetas

3. **Analytics de assets**
   - Assets más usados
   - Performance por tipo de asset
   - Engagement por aspect ratio

4. **Integración con generación IA**
   - Generar variaciones desde Bóveda
   - Auto-crop a diferentes ratios
   - Batch generation de piezas

5. **Gestión de carpetas**
   - Crear/renombrar carpetas desde dashboard
   - Mover assets visualmente (drag & drop)
   - Organización automática por fecha/tipo

---

## 📚 Referencias

- [Google Drive API - Files.list](https://developers.google.com/drive/api/v3/reference/files/list)
- [Google Drive API - ImageMediaMetadata](https://developers.google.com/drive/api/v3/reference/files#resource)
- [Aspect Ratios para Redes Sociales 2026](https://sproutsocial.com/insights/social-media-image-sizes-guide/)

---

## ✅ Checklist de Implementación

- [x] Endpoint `/assets` con exploración recursiva
- [x] Detección automática de aspect ratio
- [x] Cross-reference con calendario
- [x] Endpoint `/create-post-from-asset`
- [x] Renderizado de assets con badges de estado
- [x] Modal de creación rápida
- [x] Estilos CSS para todos los elementos
- [x] Hover con botón flotante
- [x] Cache busting (v=6)
- [x] Deploy a producción
- [ ] Documentación para usuarios finales
- [ ] Video tutorial de uso

---

**Deploy:** Commit `428dd07`  
**Producción:** https://f0f0stud1od4shb0ard4ds.netlify.app/  
**Fecha:** 2026-02-25  
**Autor:** Jarvis 🍁
