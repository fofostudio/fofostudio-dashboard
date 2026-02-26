# 🎯 Drag & Drop - Mover Posts entre Días

## 🚀 Cómo Usar

### 1. Ir a Vista Semana
- Click en tab **"Calendario"**
- Click en botón **"Semana"**

### 2. Arrastrar Post
- **Hover** sobre cualquier post card
- **Click y mantén** (cursor cambia a ✊ grab)
- **Arrastra** hacia otro día de la semana

### 3. Soltar en Día Destino
- **Hover** sobre el día destino (se ilumina naranja)
- **Suelta** el mouse

### 4. Confirmar
```
¿Mover "Post educativo: Tips..." 
de miércoles, 25 febrero 
a jueves, 26 febrero?

[Cancelar] [Aceptar]
```

### 5. Actualización Automática
- ⏳ Loading overlay
- 📊 Actualiza Google Sheets
- 🔄 Recarga calendario
- ✅ Notificación de éxito

---

## 🎨 Visual Feedback

### Cursor
- **Normal:** `cursor: grab` 👋
- **Arrastrando:** `cursor: grabbing` ✊
- **Card:** `opacity: 0.4` (semi-transparente)

### Drop Zone
- **Hover con card:** Fondo naranja, borde naranja, scale 1.02
- **Sin card:** Estado normal

### Notificación
```
┌──────────────────────────┐
│ ✅ Fecha actualizada     │
│    exitosamente          │
└──────────────────────────┘
```
Aparece arriba a la derecha, desaparece en 3 segundos.

---

## 🔧 Flujo Técnico

### Frontend (calendar.js)

**1. Drag Start**
```javascript
handleDragStart(event)
  → Guardar datos del post
  → Cambiar opacidad a 0.4
  → Permitir "move"
```

**2. Drag Over**
```javascript
handleDragOver(event)
  → Prevenir default
  → Agregar clase "drag-over"
  → Feedback visual naranja
```

**3. Drop**
```javascript
handleDrop(event)
  → Remover clase "drag-over"
  → Comparar fechas (old vs new)
  → Mostrar confirmación
  → Llamar API /update-post-date
  → Reload calendar
```

### Backend (update-post-date.js)

**Endpoint:** `POST /update-post-date`

**Request:**
```json
{
  "post_id": "Calendario Marzo 2026_5",
  "new_date": "2026-02-26"
}
```

**Proceso:**
1. Parse post ID → sheet name + row index
2. Buscar columna "Fecha" en header
3. Convertir index a letra (A, B, C...)
4. Update celda con `sheets.values.update()`

**Response:**
```json
{
  "success": true,
  "message": "Date updated successfully",
  "cell": "Calendario Marzo 2026!A5",
  "new_date": "2026-02-26"
}
```

---

## 🎯 Casos de Uso

### 1. Reorganizar Semana
- Vista semanal completa
- Mover posts entre días para balancear carga

### 2. Ajustar Programación
- Post quedó en día equivocado
- Drag & drop más rápido que editar

### 3. Planning Visual
- Ver semana completa
- Reorganizar en tiempo real

---

## ⚠️ Limitaciones Actuales

- ✅ Solo disponible en **Vista Semana**
- ❌ No disponible en Vista Mes (solo dots)
- ❌ No disponible en Vista Día (solo un día)
- ⚠️ Solo mueve fecha, no hora (mantiene hora original)

---

## 🔮 Mejoras Futuras

- [ ] Drag & drop en Vista Mes
- [ ] Drag & drop entre semanas
- [ ] Cambiar hora al arrastrar verticalmente
- [ ] Undo (deshacer movimiento)
- [ ] Batch move (mover múltiples posts)
- [ ] Preview del post mientras arrastras
- [ ] Snap to grid (alinear automáticamente)

---

## 🐛 Troubleshooting

### "Error al mover el post"
- **Causa:** Falta autenticación OAuth
- **Solución:** Recarga página y login con Google

### "Date column not found"
- **Causa:** Sheet sin columna "Fecha"
- **Solución:** Agregar columna "Fecha" en sheet

### El post vuelve a su posición original
- **Causa:** Usuario canceló confirmación
- **Solución:** Normal, drag cancelado

### Loading infinito
- **Causa:** Error de red o API
- **Solución:** Recarga página (F5)

---

## 📊 Analytics

Cada movimiento se registra en:
- **Activity Log:** `📅 Post movido: {title}...`
- **Google Sheets:** Fecha actualizada directamente

---

**Fecha:** 2026-02-25  
**Commit:** `263f61c` (feature) + `8ec757a` (cache)  
**Branch:** `master`
