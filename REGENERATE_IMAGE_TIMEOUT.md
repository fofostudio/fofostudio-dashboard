# ⚠️ Regenerar Imagen - Problema de Timeout

## Problema Actual

La función "Regenerar Pieza" puede fallar con **error 504 (Gateway Timeout)** porque:

1. **Netlify Free Plan:** Timeout de 10 segundos para serverless functions
2. **Generación de imagen:** Toma 30-90 segundos con NanobananaAPI
3. **Polling síncrono:** La función espera la generación completa antes de responder

---

## Error en Console

```
❌ Error al regenerar: Unexpected token '<', " app.js?v=7:593
Uncaught (in promise) TypeError: Cannot set properties of null (setting 'innerHTML')
/.netlify/functions/regenerate-image:1 Failed to load resource: the server responded with a status of 504
```

**Traducción:** El servidor respondió con un timeout (504) y devolvió HTML en lugar de JSON.

---

## Soluciones

### Solución Temporal (Actual)

El frontend ahora maneja mejor el error 504:

**Antes:**
- ❌ Crash con error de parsing JSON
- ❌ Error al acceder a elementos null
- ❌ Mensaje genérico "Unexpected token"

**Ahora:**
- ✅ Detecta timeout 504 automáticamente
- ✅ Protege acceso a elementos del DOM (evita crash)
- ✅ Mensaje claro: "Timeout del servidor. La generación puede estar en progreso. Espera 1-2 minutos y recarga."
- ✅ Permite reintentar después de esperar

**Workflow recomendado:**
1. Click en "Regenerar Pieza"
2. Si aparece error 504 → **Esperar 1-2 minutos**
3. Recargar calendario (F5 o botón refresh)
4. Verificar si la imagen se actualizó en el post
5. Si no se actualizó → Reintentar

---

### Solución Ideal (Producción)

**Implementar generación asíncrona con webhooks:**

#### Backend Changes

**Paso 1:** Endpoint retorna inmediatamente con `taskId`

```javascript
// netlify/functions/regenerate-image-async.js
exports.handler = async (event, context) => {
  // 1. Crear taskId único
  const taskId = `regen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 2. Iniciar generación con callbackUrl
  const callbackUrl = `${process.env.SITE_URL}/.netlify/functions/regenerate-callback`;
  
  await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${nanobananaApiKey}` },
    body: JSON.stringify({
      prompt: prompt,
      resolution: '2K',
      aspectRatio: aspectRatio,
      model: 'nano-banana-pro',
      callBackUrl: `${callbackUrl}?taskId=${taskId}&postId=${post_id}`
    })
  });
  
  // 3. Guardar taskId en estado temporal (DynamoDB, Redis, o archivo)
  await saveTaskState(taskId, { postId: post_id, sheetName, rowIndex });
  
  // 4. Retornar inmediatamente
  return {
    statusCode: 202, // Accepted
    body: JSON.stringify({ 
      message: 'Generación iniciada',
      taskId: taskId,
      estimatedTime: '30-90 segundos'
    })
  };
};
```

**Paso 2:** Endpoint de callback recibe resultado

```javascript
// netlify/functions/regenerate-callback.js
exports.handler = async (event, context) => {
  const { taskId, postId } = event.queryStringParameters;
  const result = JSON.parse(event.body);
  
  if (result.code === 200 && result.data?.imageUrl) {
    // 1. Descargar imagen
    // 2. Subir a Google Drive
    // 3. Actualizar Google Sheets
    // 4. Notificar al usuario (websocket o polling)
    
    await updateTaskState(taskId, { 
      status: 'completed',
      imageUrl: driveUrl
    });
  }
  
  return { statusCode: 200, body: 'OK' };
};
```

**Paso 3:** Frontend hace polling de estado

```javascript
async function regenerateImageAsync() {
  // 1. Iniciar generación
  const response = await fetch('/regenerate-image-async', { ... });
  const { taskId } = await response.json();
  
  // 2. Mostrar progreso
  showProgressModal(taskId);
  
  // 3. Polling cada 5 segundos
  const interval = setInterval(async () => {
    const status = await fetch(`/task-status?taskId=${taskId}`);
    const data = await status.json();
    
    if (data.status === 'completed') {
      clearInterval(interval);
      hideProgressModal();
      updatePostImage(data.imageUrl);
      alert('✅ Pieza regenerada!');
    } else if (data.status === 'failed') {
      clearInterval(interval);
      hideProgressModal();
      alert('❌ Error: ' + data.error);
    }
  }, 5000);
}
```

---

### Solución Alternativa (Sin Backend Change)

**Usar plan Netlify Pro:**

```toml
# netlify.toml
[functions]
  timeout = 26 # Max en Pro plan
```

**Ventajas:**
- ✅ No requiere cambios de código
- ✅ Rápido de implementar

**Desventajas:**
- ❌ Cuesta $19/mes
- ❌ Aún puede hacer timeout si generación > 26s
- ❌ No escala bien (función ocupada durante toda la generación)

---

## Comparación de Enfoques

| Enfoque | Timeout Risk | Costo | Complejidad | Escalabilidad |
|---------|-------------|-------|-------------|---------------|
| **Actual (Síncrono)** | 🔴 Alto | ✅ Gratis | ✅ Baja | 🔴 Mala |
| **Async + Webhooks** | ✅ Ninguno | ✅ Gratis | 🟡 Media | ✅ Excelente |
| **Netlify Pro** | 🟡 Medio | 🔴 $19/mes | ✅ Baja | 🟡 Aceptable |

---

## Código Actualizado (Frontend)

### Fixes Implementados

**1. Validación de elementos del DOM:**

```javascript
function addActivityLogItem(text) {
  const log = document.getElementById('activity-log');
  if (!log) return; // ✅ Protect against null
  // ...
}
```

**2. Manejo de event undefined:**

```javascript
async function regenerateImage(event) {
  let regenerateBtn = null;
  
  // ✅ Check if event exists before accessing
  if (event && event.target) {
    regenerateBtn = event.target.closest('.btn-regenerate');
    // ...
  }
}
```

**3. Detección de timeout 504:**

```javascript
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('Timeout o error del servidor. La generación puede tomar más tiempo...');
}
```

**4. Mensaje de error mejorado:**

```javascript
let errorMsg = error.message;
if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
  errorMsg = 'Timeout del servidor (504). La generación puede estar en progreso. Espera 1-2 minutos y recarga.';
}
alert('❌ Error al regenerar:\n\n' + errorMsg);
```

---

## Recomendaciones

### Corto Plazo (Ahora)

1. ✅ **Frontend mejorado** - Ya implementado
2. ⏳ **Instruir usuarios** sobre el workflow de timeout
3. ⏳ **Agregar indicador de progreso** más detallado

### Mediano Plazo (Semana 1-2)

1. Implementar generación asíncrona con webhooks
2. Agregar sistema de notificaciones (push o polling)
3. Crear UI de "tareas en progreso"

### Largo Plazo (Mes 1+)

1. Migrar a plataforma con timeouts más largos (AWS Lambda: 15 min)
2. Implementar queue de generaciones (Bull, RabbitMQ)
3. Agregar retry automático en caso de fallas

---

## Testing

### Reproducir Error 504

```bash
# Llamar endpoint directamente (causará timeout)
curl -X POST https://f0f0stud1od4shb0ard4ds.netlify.app/.netlify/functions/regenerate-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-123",
    "description": "Promoción de servicios",
    "type": "feed"
  }'

# Expected: 504 después de 10 segundos
```

### Verificar Fix

1. Abrir dashboard en navegador
2. Abrir DevTools Console
3. Intentar regenerar una pieza
4. Verificar que NO aparece error de "Cannot set properties of null"
5. Verificar mensaje de error claro sobre timeout

---

## Logs para Debugging

### Frontend (Browser Console)

```javascript
console.log('Regenerating image for post:', selectedPost.id);
console.log('Response status:', response.status);
console.log('Content-Type:', response.headers.get('content-type'));
```

### Backend (Netlify Function Logs)

```bash
# Ver logs en tiempo real
netlify functions:log regenerate-image

# Buscar errores 504
netlify functions:log regenerate-image --filter "504"
```

---

## Status

- ✅ Frontend mejorado (crash fixes, mejor error handling)
- ✅ Documentación completa del problema
- ⏳ Implementación asíncrona pendiente
- ⏳ Plan Pro upgrade pendiente (decisión del cliente)

---

**Última actualización:** 2026-02-26  
**Commit relacionado:** Próximo commit con fixes  
**Issue tracking:** Crear issue en GitHub repo si es necesario
