# 🚀 Nueva Funcionalidad: Publicar Ahora

## Características Agregadas

### 1. Botón "Volver" en Modal de Detalle
- Reemplaza el botón "Cancelar"
- Navegación más intuitiva con icono ←

### 2. Botón "Publicar Ya" 🚀
- **Solo aparece** en posts que NO están publicados
- Publica **inmediatamente** en Facebook y/o Instagram
- Confirmación antes de publicar
- Estado de carga mientras publica
- Notificación de éxito/error

### 3. Flujo de Publicación
```
Usuario → Click "Publicar Ya" 
       → Confirmación 
       → Publica en Meta API
       → Actualiza calendario
       → Muestra resultado
```

## 📋 ACCIÓN REQUERIDA: Configurar META_PAGE_ID

Para que la función "Publicar Ya" funcione, necesitas agregar una variable más en Netlify:

### Pasos:

1. **Ve a Netlify Dashboard:**
   https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/configuration/env

2. **Agrega esta variable:**
   - **Nombre:** `META_PAGE_ID`
   - **Valor:** `107313642310633`

3. **Trigger deploy:**
   - Ve a: https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/deploys
   - Click "Trigger deploy" → "Deploy site"

4. **Espera 1-2 minutos** y recarga el dashboard

## 🎯 Cómo Usar

1. Abre el dashboard: https://f0f0stud1od4shb0ard4ds.netlify.app/
2. Click en cualquier día del calendario
3. Click en un post **NO publicado** (scheduled/pending)
4. Verás el botón verde **"🚀 Publicar Ya"**
5. Click → Confirma → ¡Publicado!

## ✅ Funcionalidades Soportadas

### Facebook
- ✅ Posts con imagen
- ✅ Posts solo texto
- ✅ Caption + hashtags

### Instagram
- ✅ Feed posts con imagen (obligatorio)
- ✅ Stories con imagen (obligatorio)
- ✅ Caption + hashtags

### Plataformas
- ✅ Solo Facebook
- ✅ Solo Instagram
- ✅ Ambas plataformas (both)

## ⚠️ Limitaciones

### Instagram
- **Requiere imagen obligatoriamente** (tanto feed como stories)
- Si no hay imagen en el post, mostrará error
- Instagram Business Account debe estar vinculado a la página

### General
- El post se marca como publicado en el calendario
- No se puede despublicar desde el dashboard (solo eliminar)

## 🔧 Troubleshooting

### "No Instagram Business Account linked"
- Ve a Facebook → Settings → Instagram
- Vincula tu cuenta de Instagram Business

### "Image URL required"
- Instagram requiere imagen siempre
- Asegúrate de que "URL Imagen" esté llena en el spreadsheet

### "Invalid access token"
- Tu token de Meta expiró
- Renueva el token y actualiza `META_ACCESS_TOKEN` en Netlify

## 📊 Logs y Debugging

Si algo falla:
1. Abre DevTools (F12) → Console
2. Busca errores en rojo
3. El mensaje de error te dirá qué falló

## 🎨 Capturas

**Modal con botón "Publicar Ya":**
```
┌──────────────────────────────────┐
│ Editar Post              ✕       │
├──────────────────────────────────┤
│ [Preview del post con imagen]    │
│ [Formulario editable]             │
├──────────────────────────────────┤
│ ← Volver    🚀 Publicar Ya       │
│             Eliminar  Guardar     │
└──────────────────────────────────┘
```

**Post ya publicado:**
```
┌──────────────────────────────────┐
│ Editar Post              ✕       │
├──────────────────────────────────┤
│ [Preview del post]                │
│ Estado: published                 │
├──────────────────────────────────┤
│ ← Volver    Eliminar  Guardar    │
│         (sin botón Publicar Ya)   │
└──────────────────────────────────┘
```

## 🚦 Estado Actual

- ✅ Frontend implementado
- ✅ Backend endpoint creado
- ✅ Integración con Meta API
- ⏳ Requiere configurar `META_PAGE_ID` en Netlify
- ⏳ Probar publicación real

---

**Fecha:** 2026-02-25  
**Commit:** `4394552`  
**Branch:** `master`
