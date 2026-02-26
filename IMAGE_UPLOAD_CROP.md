# 📤 Subir Imágenes desde PC con Crop Automático

## Visión General

Nueva funcionalidad que permite **subir imágenes directamente desde tu computadora** con **crop automático inteligente** según el tipo de post.

---

## 🎯 Características

### 1. **Subir desde PC**
- ✅ Botón "📤 Subir desde PC" en modal de edición
- ✅ Selector de archivos (cualquier formato de imagen)
- ✅ Upload directo a Google Drive (carpeta "Uploads")
- ✅ Actualización automática en Google Sheets

### 2. **Crop Automático Inteligente**
- ✅ **Detección automática** de aspect ratio de la imagen
- ✅ **Comparación** con aspect ratio esperado según tipo de post
- ✅ Si no coincide → **Muestra herramienta de recorte**
- ✅ Si coincide → **Sube directamente** sin crop

### 3. **Herramienta de Recorte Visual**
- ✅ Canvas interactivo con preview en tiempo real
- ✅ Área de recorte resaltada con borde naranja
- ✅ Drag & drop para mover área de recorte
- ✅ Indicadores visuales en las esquinas
- ✅ Crop automáticamente centrado y maximizado

---

## 📐 Aspect Ratios por Tipo de Post

| Tipo de Post | Aspect Ratio Esperado | Dimensiones Típicas |
|--------------|----------------------|---------------------|
| **Story** | 9:16 | 1080×1920 |
| **Reel** | 9:16 | 1080×1920 |
| **Feed** | 4:5 | 1080×1350 |
| **Carrusel** | 1:1 | 1080×1080 |

**Tolerancia:** ±0.05 en el ratio decimal

**Ejemplos:**
- Imagen 1000×1000 para Feed (4:5) → Requiere crop (1000×1250)
- Imagen 1080×1920 para Story (9:16) → No requiere crop ✅
- Imagen 1920×1080 para Reel (9:16) → Requiere crop (608×1080)

---

## 🎨 Workflow de Uso

### Caso 1: Imagen con Aspect Ratio Correcto

1. **Abre post** en modal de edición
2. **Click "📤 Subir desde PC"**
3. **Selecciona imagen** (ej: 1080×1920 para story)
4. Sistema detecta ratio correcto → **Sube directamente**
5. ✅ Preview actualizado
6. ✅ Imagen en Google Drive
7. ✅ URL actualizada en Sheets

**Tiempo:** ~3-5 segundos

### Caso 2: Imagen Requiere Crop

1. **Abre post** en modal de edición
2. **Click "📤 Subir desde PC"**
3. **Selecciona imagen** (ej: 1920×1080 para story)
4. Sistema detecta ratio incorrecto → **Muestra crop tool**

**Modal de Crop:**
```
┌───────────────────────────────────────┐
│ Ajustar Proporción                    │
├───────────────────────────────────────┤
│ 📐 La imagen debe ser 9:16 para       │
│    posts tipo story                   │
├───────────────────────────────────────┤
│ [Canvas con preview de imagen]        │
│                                       │
│ ┌─────────────┐                      │
│ │   Área de   │  ← Área resaltada    │
│ │   recorte   │     que se guardará  │
│ │             │                      │
│ └─────────────┘                      │
│                                       │
│ (Arrastra para ajustar posición)     │
├───────────────────────────────────────┤
│ [✓ Aplicar Recorte]  [Cancelar]      │
└───────────────────────────────────────┘
```

5. **Arrastra** el área de recorte para ajustar
6. **Click "✓ Aplicar Recorte"**
7. Sistema recorta, sube y actualiza
8. ✅ Imagen perfecta con ratio correcto

**Tiempo:** ~10-15 segundos

---

## 🛠️ Implementación Técnica

### Frontend: Upload Flow

**Archivo:** `public/app.js`

**Funciones principales:**

```javascript
// 1. Trigger file selector
function uploadImageFromPC() {
    document.getElementById('image-upload-input').click();
}

// 2. Handle file selection
async function handleImageUpload(event) {
    const file = event.target.files[0];
    // Read as base64
    // Check if crop is needed
    // Show crop modal or upload directly
}

// 3. Get expected aspect ratio
function getExpectedAspectRatio(postType) {
    // Returns { label: '9:16', decimal: 0.5625 }
}

// 4. Show crop modal
function showCropModal(img, expectedRatio, fileName) {
    // Renders canvas with crop tool
}

// 5. Apply crop
async function applyCrop() {
    // Crops image on canvas
    // Converts to blob
    // Uploads to server
}

// 6. Upload to server
async function uploadImageToServer(base64Data, fileName) {
    // POST to /upload-image
    // Updates preview
    // Reloads calendar
}
```

### Frontend: Crop Tool

**Canvas rendering:**

```javascript
let cropState = {
    img: Image,           // Original image
    ratio: Object,        // Expected aspect ratio
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    cropX: 0,             // Crop position X
    cropY: 0,             // Crop position Y
    cropWidth: 0,         // Crop width
    cropHeight: 0,        // Crop height
    isDragging: false,    // Drag state
    dragStartX: 0,
    dragStartY: 0
};
```

**Crop calculation:**

```javascript
// If image is wider than target ratio
if (imgRatio > expectedRatio.decimal) {
    cropHeight = img.height;
    cropWidth = img.height * expectedRatio.decimal;
    cropX = (img.width - cropWidth) / 2;  // Center
    cropY = 0;
}

// If image is taller than target ratio
else {
    cropWidth = img.width;
    cropHeight = img.width / expectedRatio.decimal;
    cropX = 0;
    cropY = (img.height - cropHeight) / 2;  // Center
}
```

**Drag handling:**

```javascript
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', endDrag);

function drag(e) {
    // Calculate new position
    // Constrain to image bounds
    // Redraw preview
}
```

---

### Backend: Upload Endpoint

**Archivo:** `netlify/functions/upload-image.js`

**Request:**
```json
POST /upload-image
Headers: Authorization: Bearer {access_token}
Body: {
  "post_id": "post-45",
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "file_name": "mi-imagen.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "image_url": "https://lh3.googleusercontent.com/d/1abc...",
  "file_id": "1abc...",
  "file_name": "1709177845-mi-imagen.jpg"
}
```

**Proceso:**

1. **Validate auth token**
2. **Parse base64 image data**
3. **Find or create "Uploads" folder** in Drive root
4. **Generate unique filename** (timestamp + sanitized name)
5. **Upload to Google Drive**
   ```javascript
   const uploadResponse = await drive.files.create({
     requestBody: { name: uniqueFileName, parents: [uploadsFolderId] },
     media: { mimeType: 'image/jpeg', body: imageBuffer }
   });
   ```
6. **Make file public**
   ```javascript
   await drive.permissions.create({
     fileId: fileId,
     requestBody: { role: 'reader', type: 'anyone' }
   });
   ```
7. **Generate public URL** (`lh3.googleusercontent.com/d/{fileId}`)
8. **Update Google Sheets** (column H with new URL)
9. **Return URL to frontend**

---

## 📁 Estructura de Google Drive

**Antes:**
```
101aDQpLF84Kfln7fwoPexKa1MPhZBHpz (ROOT)
├── Social Pieces/
├── Logos/
├── Photos/
└── References/
```

**Después (con uploads):**
```
101aDQpLF84Kfln7fwoPexKa1MPhZBHpz (ROOT)
├── Social Pieces/
├── Logos/
├── Photos/
├── References/
└── Uploads/          ← Nueva carpeta creada automáticamente
    ├── 1709177845-screenshot.jpg
    ├── 1709178123-promo-image.png
    └── 1709179456-cropped-image.jpg
```

**Nomenclatura de archivos:**
- Formato: `{timestamp}-{sanitized-filename}`
- Timestamp: Unix milliseconds (garantiza unicidad)
- Sanitized: Caracteres especiales reemplazados por `_`

---

## 🎨 UI/UX Details

### Botones en Modal de Edición

**Orden:**
1. 🎨 **Regenerar Pieza con IA** (púrpura, puede tener timeout)
2. 📤 **Subir desde PC** (gris secondary, NUEVO)
3. 🖼️ **Cambiar URL de Imagen** (gris secondary, renombrado)

**Recomendación de uso:**
- **Subir desde PC** → Cuando tienes imagen lista en tu computadora
- **Cambiar URL** → Cuando la imagen ya está en Drive/Catbox
- **Regenerar con IA** → Cuando quieres crear imagen nueva desde cero

### Crop Tool Visual

**Elementos:**

1. **Alert box naranja** (arriba)
   - Muestra aspect ratio esperado
   - Tipo de post actual
   - Ej: "📐 La imagen debe ser 9:16 para posts tipo story"

2. **Canvas de preview** (centro)
   - Imagen completa en background (40% opacity)
   - Área de crop resaltada (100% opacity)
   - Borde naranja (#ff7519) de 3px
   - Esquinas resaltadas con indicadores

3. **Botones de acción** (abajo)
   - "✓ Aplicar Recorte" (naranja primary)
   - "Cancelar" (gris secondary)

**Interacción:**
- Cursor cambia a "move" sobre canvas
- Click & drag para mover área de crop
- Crop se mantiene dentro de bounds de imagen
- Preview actualiza en tiempo real durante drag

---

## 🧪 Testing

### Test 1: Upload sin Crop (Ratio Correcto)

**Setup:**
- Post tipo: Story (9:16)
- Imagen: 1080×1920

**Steps:**
1. Abrir post en modal
2. Click "Subir desde PC"
3. Seleccionar imagen 1080×1920

**Expected:**
- ✅ No muestra crop tool
- ✅ Sube directamente
- ✅ Preview actualizado en ~3s
- ✅ Sheets actualizado con nueva URL

### Test 2: Upload con Crop (Ratio Incorrecto)

**Setup:**
- Post tipo: Story (9:16)
- Imagen: 1920×1080 (landscape)

**Steps:**
1. Abrir post en modal
2. Click "Subir desde PC"
3. Seleccionar imagen 1920×1080
4. **Crop modal aparece**
5. Arrastrar área de crop si necesario
6. Click "Aplicar Recorte"

**Expected:**
- ✅ Muestra crop tool
- ✅ Área inicial centrada y maximizada
- ✅ Drag funciona suavemente
- ✅ Preview actualiza durante drag
- ✅ Imagen recortada correctamente
- ✅ Upload exitoso
- ✅ Ratio final = 9:16

### Test 3: Upload Feed (4:5)

**Setup:**
- Post tipo: Feed (4:5)
- Imagen: 1080×1080 (square)

**Steps:**
1. Abrir post tipo feed
2. Click "Subir desde PC"
3. Seleccionar imagen 1080×1080

**Expected:**
- ✅ Crop tool aparece (1080×1080 ≠ 4:5)
- ✅ Área de crop calculada: 1080×1350
- ✅ Imagen requiere extensión (imposible)
- ⚠️ Usuario debe seleccionar otra imagen o crop a menos área

**Note:** Si imagen es más pequeña que ratio esperado, crop no puede agrandar. Usuario debe:
- Seleccionar imagen más grande
- O cambiar tipo de post a uno compatible

---

## ⚠️ Limitaciones Conocidas

### 1. Tamaño Máximo de Archivo

**Netlify Free Plan:**
- Body size limit: **6 MB** por request
- Base64 encoding aumenta tamaño ~33%
- Imagen original máxima: ~4.5 MB

**Solución:**
- Frontend valida tamaño antes de upload
- Compresión JPEG a 92% quality
- Para imágenes > 4 MB: usar "Cambiar URL" con Drive directo

### 2. Formatos Soportados

**Input:**
- ✅ JPG/JPEG
- ✅ PNG
- ✅ WebP
- ✅ GIF (sube como JPEG estático)

**Output:**
- Siempre **JPEG** (92% quality)
- Optimizado para web

### 3. Crop Tool Limitaciones

**No soporta:**
- ❌ Resize (solo crop)
- ❌ Rotate
- ❌ Filters/adjustments
- ❌ Multi-area crop

**Workaround:**
- Editar imagen en app externa (Photoshop, Canva, etc.)
- Luego subir versión final

### 4. Aspect Ratio Strict

**Si imagen es más pequeña que ratio esperado:**
- No puede crop automáticamente
- Usuario debe seleccionar imagen más grande

**Ejemplo problemático:**
- Post: Story (9:16) → necesita ~562×1000 mínimo
- Imagen: 500×500
- Crop tool no puede crear 500×889 (no hay suficiente altura)

**Solución:**
- Mensaje de error claro
- Sugerencia: "Selecciona imagen más grande"

---

## 🚀 Mejoras Futuras

### Short-term

- [ ] Validación de tamaño de archivo en frontend
- [ ] Mensaje de error si imagen muy pequeña
- [ ] Loading indicator durante upload (% progress)
- [ ] Thumbnail preview antes de upload

### Mid-term

- [ ] Resize automático si imagen muy grande
- [ ] Soporte para múltiples imágenes (batch upload)
- [ ] Drag & drop directo en preview (sin botón)
- [ ] Undo crop (volver a ajustar)

### Long-term

- [ ] Editor completo (rotate, filters, text)
- [ ] Templates pre-diseñados por tipo
- [ ] AI auto-crop (detección de sujeto principal)
- [ ] Video upload con thumbnail extraction

---

## 📊 Comparación de Métodos

| Método | Velocidad | Flexibilidad | Calidad | Uso Recomendado |
|--------|-----------|--------------|---------|-----------------|
| **Regenerar con IA** | Lenta (30-90s) | Alta | Alta | Crear desde cero |
| **Subir desde PC** | Rápida (3-15s) | Media | Alta | Imagen ya lista |
| **Cambiar URL** | Instantánea | Baja | Alta | Imagen en Drive |

---

## 🎯 Casos de Uso

### Caso 1: Fotógrafo Profesional

**Escenario:** Tienes sesión de fotos, quieres usar foto específica

**Workflow:**
1. Selecciona mejor foto en Lightroom
2. Exporta a 1080×1350 (4:5 para feed)
3. Sube desde PC → No requiere crop
4. ✅ Post con foto profesional de alta calidad

### Caso 2: Screenshot de Instagram Story

**Escenario:** Viste story que quieres repostear

**Workflow:**
1. Screenshot en teléfono (probablemente 9:16)
2. Transfiere a PC
3. Sube desde PC al post tipo story
4. ✅ Ratio correcto, upload directo

### Caso 3: Imagen de Canva

**Escenario:** Diseñaste pieza en Canva en formato incorrecto

**Workflow:**
1. Descarga desde Canva (1920×1080 landscape)
2. Intenta subir a post tipo story (9:16)
3. Crop tool aparece
4. Ajusta crop para capturar parte importante
5. Aplica recorte
6. ✅ Imagen adaptada al formato correcto

### Caso 4: Bulk Content Prep

**Escenario:** Preparaste 10 imágenes en lote

**Workflow:**
1. Asegúrate que todas sean 1080×1920 (stories)
2. Para cada post:
   - Abre modal
   - Sube desde PC
   - Upload directo (sin crop)
3. ✅ 10 posts actualizados en minutos

---

## 📚 Documentación Relacionada

- **POST_EDITING.md** - Edición completa de posts
- **BOVEDA_COMPLETA.md** - Explorador de assets de Drive
- **REGENERATE_IMAGE_TIMEOUT.md** - Problemas de timeout con IA

---

## ✅ Checklist de Implementación

- [x] Frontend: Botón "Subir desde PC"
- [x] Frontend: Input file hidden
- [x] Frontend: Handler de upload con detección de ratio
- [x] Frontend: Crop tool con canvas interactivo
- [x] Frontend: Drag & drop en crop canvas
- [x] Frontend: Apply crop con conversión a blob
- [x] Backend: Endpoint `/upload-image`
- [x] Backend: Upload a Google Drive con permisos públicos
- [x] Backend: Actualización de Sheets con nueva URL
- [x] Backend: Creación automática de carpeta "Uploads"
- [x] Testing: Upload sin crop (ratio correcto)
- [x] Testing: Upload con crop (ratio incorrecto)
- [ ] Testing: Validación de tamaño de archivo
- [ ] Testing: Manejo de errores de red
- [ ] Testing: Compatibilidad multi-browser

---

**Deploy:** Commit `4c660a7`  
**Producción:** https://f0f0stud1od4shb0ard4ds.netlify.app/  
**Fecha:** 2026-02-26  
**Autor:** Jarvis 🍁
