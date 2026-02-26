# 🎨 Regenerar Pieza Gráfica

## 🎯 Resumen

Botón de **regeneración automática** de imágenes usando IA (NanobananaAPI) con subida a Google Drive y actualización en Sheets — todo por debajo.

---

## 🚀 Cómo Funciona

### 1. **Usuario hace click en "🎨 Regenerar Pieza"**
- Botón disponible en modal de detalle del post
- Ubicado debajo del preview de imagen
- Color: Gradiente púrpura (diferente a otros botones)

### 2. **Confirmación**
```
¿Regenerar pieza gráfica para "Post educativo: Tips..."?

Esto tomará 30-60 segundos.

[Cancelar] [Aceptar]
```

### 3. **Loading States**

**Botón:**
```
🎨 Regenerar Pieza  →  ⏳ Generando...
```

**Preview:**
```
┌──────────────┐
│      ⏳      │
│              │
│ Generando    │
│  con IA...   │
└──────────────┘
```

---

## 🔄 Flujo Automatizado Completo

### PASO 1: Generación con NanobananaAPI

**Endpoint:** `POST https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro`

**Request:**
```json
{
  "prompt": "FofoStudio brand style, premium dark aesthetic, orange accents (#ff7519), glassmorphism, high legibility, commercial professional look, modern tech vibe, square feed post, clear hierarchy, product/service focus, call-to-action visible. Main message: \"💻 ¿Tu página web realmente vende? En FofoStudio creamos webs rápidas...\". Clear text, high contrast, marketing-ready, professional composition.",
  "resolution": "2K",
  "aspectRatio": "4:5",  // or "9:16" for stories
  "model": "nano-banana-pro"
}
```

**Headers:**
```
Authorization: Bearer 5ed16c1bb7c3c42bcb94cc78aa4f97db
Content-Type: application/json
```

**Response:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123..."
  }
}
```

### PASO 2: Polling del Resultado

**Endpoint:** `GET https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId={taskId}`

**Polling:**
- Intervalo: 2 segundos
- Max intentos: 30 (60 segundos total)
- Break cuando `resultImageUrl` está disponible

**Response exitoso:**
```json
{
  "code": 200,
  "data": {
    "info": {
      "resultImageUrl": "https://catbox.moe/abc123.jpg"
    }
  }
}
```

### PASO 3: Descarga de Imagen

```javascript
const imageResponse = await fetch(resultImageUrl);
const imageBuffer = await imageResponse.buffer();
const imageBase64 = imageBuffer.toString('base64');
```

### PASO 4: Subida a Google Drive

**Estructura de carpetas:**
```
FofoStudio Root (101aDQpLF84Kfln7fwoPexKa1MPhZBHpz)
└── Social Pieces/
    └── 2026-02-25/
        └── feed_2026-02-25_abc12345.jpg
```

**API Call:**
```javascript
const drive = google.drive({ version: 'v3', auth });

await drive.files.create({
  requestBody: {
    name: filename,
    parents: [dateFolderId]
  },
  media: {
    mimeType: 'image/jpeg',
    body: Buffer.from(imageBase64, 'base64')
  }
});
```

**URLs generadas:**
- **webViewLink:** `https://drive.google.com/file/d/{fileId}/view`
- **directURL:** `https://lh3.googleusercontent.com/d/{fileId}` (para preview)

### PASO 5: Actualización en Google Sheets

**Buscar columna "URL Imagen":**
```javascript
const headers = await sheets.values.get(range: "Sheet!A1:Z1");
const imageColIndex = headers.findIndex(h => h.includes('imagen'));
```

**Actualizar celda:**
```javascript
await sheets.values.update({
  range: `Sheet!{columnLetter}{rowIndex}`,
  valueInputOption: 'RAW',
  values: [[driveUrl]]
});
```

**Ejemplo:**
```
Calendario Marzo 2026!H5 = https://drive.google.com/file/d/xyz123/view
```

### PASO 6: Respuesta al Frontend

```json
{
  "success": true,
  "message": "Pieza regenerada exitosamente",
  "task_id": "abc123...",
  "drive_url": "https://drive.google.com/file/d/xyz/view",
  "direct_url": "https://lh3.googleusercontent.com/d/xyz",
  "filename": "feed_2026-02-25_abc12345.jpg"
}
```

---

## 🎨 Generación de Prompts

### Prompt Base (FofoStudio Brand)
```
FofoStudio brand style, premium dark aesthetic, orange accents (#ff7519), 
glassmorphism, high legibility, commercial professional look, modern tech vibe
```

### Por Tipo de Post

**Feed (4:5):**
```
square feed post, clear hierarchy, product/service focus, 
call-to-action visible
```

**Story (9:16):**
```
vertical story format, bold title at top, clear CTA at bottom, 
mobile-optimized
```

### Mensaje Principal
```
Main message: "{first 150 chars of description}"
```

### Finalización
```
Clear text, high contrast, marketing-ready, professional composition.
```

---

## 📁 Organización en Drive

### Nombres de Archivo
```
{type}_{date}_{taskId_prefix}.jpg
```

**Ejemplos:**
- `feed_2026-02-25_abc12345.jpg`
- `story_2026-02-25_xyz67890.jpg`

### Estructura de Carpetas
```
FofoStudio Root/
├── Social Pieces/
│   ├── 2026-02-25/
│   │   ├── feed_2026-02-25_abc.jpg
│   │   ├── story_2026-02-25_def.jpg
│   │   └── ...
│   ├── 2026-02-26/
│   │   └── ...
│   └── ...
└── ...
```

---

## ✨ UX/UI

### Botón Estados

**Normal:**
```css
background: linear-gradient(135deg, #a78bfa, #8b5cf6);
color: white;
```

**Hover:**
```css
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
```

**Loading:**
```css
cursor: not-allowed;
opacity: 0.7;
```

### Preview States

**Original:**
```html
<img src="{original_url}" alt="...">
```

**Loading:**
```html
<div>
  <div style="font-size: 3rem;">⏳</div>
  <div>Generando con IA...</div>
</div>
```

**Nueva Imagen:**
```html
<img src="{new_direct_url}" alt="Nueva pieza generada">
```

### Notificación de Éxito
```
✅ ¡Pieza regenerada exitosamente!

📁 Guardada en Google Drive
📊 Actualizada en Sheets

[OK]
```

---

## 🔧 Configuración Requerida

### Variables de Entorno (Netlify)

**Nueva variable:**
```
NANOBANANA_API_KEY = 5ed16c1bb7c3c42bcb94cc78aa4f97db
```

**Variables existentes necesarias:**
- `GOOGLE_SPREADSHEET_ID` (para actualizar Sheets)
- User OAuth token (enviado en Authorization header desde frontend)

### Dependencies
```json
{
  "node-fetch": "^2.6.7",
  "googleapis": "^118.0.0"
}
```

---

## 🚦 Error Handling

### Errores Posibles

**1. NanobananaAPI Error (code 500/501)**
```javascript
if (generateData.code !== 200) {
  throw new Error(generateData.msg || 'NanobananaAPI error');
}
```

**2. Timeout (>60 segundos)**
```javascript
if (attempts >= maxAttempts && !resultImageUrl) {
  throw new Error('Image generation timeout - try again later');
}
```

**3. Drive Upload Error**
```javascript
catch (error) {
  // Log error, return user-friendly message
  return { error: 'Failed to upload to Drive' };
}
```

**4. Sheets Update Error**
```javascript
// Non-critical - log but don't fail the entire operation
console.error('Failed to update Sheets:', error);
```

### User-Facing Errors
```
❌ Error al regenerar: Image generation timeout - try again later

❌ Error al regenerar: NanobananaAPI error

❌ Error al regenerar: Authentication required
```

---

## 🎯 Casos de Uso

### 1. **Imagen inicial no gustó**
- Usuario ve preview
- Click "Regenerar Pieza"
- Nueva variante con IA

### 2. **Cambió el copy**
- Usuario edita descripción
- Guarda cambios
- Regenera imagen para que coincida con nuevo copy

### 3. **Probar diferentes estilos**
- Regenerar múltiples veces
- Comparar variantes
- Elegir la mejor

---

## 📊 Performance

### Tiempos Estimados

- **Generación NanobananaAPI:** 20-40 segundos
- **Download + Upload Drive:** 5-10 segundos
- **Update Sheets:** 1-2 segundos
- **Total:** 30-60 segundos

### Optimizaciones

- ✅ Polling cada 2 segundos (balance entre rapidez y carga)
- ✅ Max 30 intentos (evita loops infinitos)
- ✅ Sheets update es async (no bloquea respuesta)
- ✅ Direct URL para preview (sin auth delay)

---

## 🔮 Mejoras Futuras

- [ ] Selector de estilo (dark, light, colorful)
- [ ] Preview de 3 variantes antes de elegir
- [ ] Historial de versiones (guardar todas)
- [ ] Undo (volver a imagen anterior)
- [ ] Batch regeneration (múltiples posts)
- [ ] A/B testing de creativos
- [ ] Analytics de performance por imagen

---

## 📝 Testing Checklist

- [ ] Click "Regenerar Pieza" abre confirmación
- [ ] Loading state muestra spinner
- [ ] Imagen se genera correctamente
- [ ] Preview se actualiza con nueva imagen
- [ ] Archivo sube a Drive en carpeta correcta
- [ ] Sheets se actualiza con nueva URL
- [ ] Calendario muestra nueva imagen
- [ ] Activity log registra acción
- [ ] Error handling funciona (timeout, API errors)
- [ ] Mobile responsive

---

**Fecha:** 2026-02-25  
**Commit:** `44dcacc`  
**Branch:** `master`
