# 📅 Sistema de Vistas del Calendario

## 🎯 Resumen

El calendario ahora tiene **3 vistas diferentes** con mejor visualización de contenido y miniaturas de las piezas:

1. **📆 Vista Mes** - Grid mensual compacto
2. **📋 Vista Semana** - Cards con thumbnails (default)
3. **📄 Vista Día** - Vista detallada de cada post

---

## 📆 VISTA MES

### Características
- Grid de 7x6 días (semana completa)
- **Dots de colores** por tipo de post
- **Hover** en día muestra cantidad de posts
- **Click en día** → Modal con lista de posts

### Visualización
```
┌───────────────────────────────────────┐
│ Dom  Lun  Mar  Mié  Jue  Vie  Sáb    │
├───────────────────────────────────────┤
│  1    2    3    4    5    6    7     │
│      •••  ••   •         ••           │
│                                       │
│  8    9   10   11   12   13   14     │
│  •    ••  •••  •    ••   •    •••    │
└───────────────────────────────────────┘
```

### Colores de Dots
- 🔵 **Azul** → Feed
- 🟣 **Púrpura** → Story
- 🔴 **Rojo** → Reel
- 🟢 **Verde** → Carrusel

---

## 📋 VISTA SEMANA (Default)

### Características
- **7 columnas** (Domingo a Sábado)
- **Cards con thumbnails** de cada post
- **Info visible:** Hora, preview de título, estado
- **Click en card** → Modal de detalle

### Estructura de Card
```
┌──────────────┐
│ [THUMBNAIL]  │
│   (imagen)   │
├──────────────┤
│ 12:00 PM     │
│ 📱 Post ed...│
│ ● scheduled  │
└──────────────┘
```

### Elementos
- **Thumbnail:** 80x80px con imagen real o placeholder
- **Hora:** Naranja, bold
- **Título:** Truncado a 40 caracteres
- **Status:** Dot de color (verde=published, naranja=scheduled)

---

## 📄 VISTA DÍA

### Características
- **Timeline vertical** de posts
- **Thumbnails grandes** (150x150px)
- **Copy completo** visible (primeros 150 caracteres)
- **Badges** de tipo y plataforma
- **Estado** del post

### Estructura de Post
```
┌─────────────────────────────────────────┐
│ ⏰ 12:00 PM                             │
├──────────┬──────────────────────────────┤
│ [150px]  │ [Feed] [FB + IG]             │
│ Thumbnail│ 📱 Post educativo: Tips...   │
│          │ Comparte consejos práctico...│
│          │ ● scheduled                   │
└──────────┴──────────────────────────────┘
```

### Elementos
- **Hora grande:** 1.25rem, naranja bold
- **Thumbnail:** 150x150px (desktop) / 120x120px (tablet) / 100% width (mobile)
- **Type badge:** Color por tipo (azul/púrpura/rojo/verde)
- **Platform badge:** Gris sutil
- **Descripción:** 150 chars con "..."
- **Status badge:** Pill con color de estado

### Empty State
Si no hay posts ese día:
```
┌─────────────────────────┐
│         📅              │
│                         │
│ No hay posts programados│
│   para este día         │
│                         │
│  [+ Crear Post]         │
└─────────────────────────┘
```

---

## 🎨 Navegación entre Vistas

### Botones
```
[Mes] [Semana] [Día]
       ↑
   Activo (naranja)
```

### Navegación Temporal

**Flechas ← →:**
- **Vista Mes:** Avanza/retrocede 1 mes
- **Vista Semana:** Avanza/retrocede 7 días
- **Vista Día:** Avanza/retrocede 1 día

### Header Dinámico

**Vista Mes:**
```
Febrero 2026
```

**Vista Semana:**
```
23-29 Febrero 2026
```
o si cruza meses:
```
26 Feb - 4 Mar 2026
```

**Vista Día:**
```
Miércoles, 25 Febrero 2026
```

---

## 🖼️ Sistema de Thumbnails

### Fuentes de Imagen

1. **`post.image_url`** → URL de Google Drive (lh3.googleusercontent.com)
2. **Fallback:** SVG placeholder con emoji del tipo

### Formato de Placeholder
```svg
<svg width="80" height="80">
  <rect fill="#222" width="80" height="80"/>
  <text x="50%" y="50%">📸</text>
</svg>
```

### Emojis por Tipo
- 📱 Feed
- 📲 Story
- 🎬 Reel
- 🎠 Carrusel

### Manejo de Errores

Si la imagen falla al cargar (`onerror`):
```javascript
onerror="this.src='data:image/svg+xml,...'"
```

---

## 🎨 Estilos y Colores

### Theme Variables
```css
--accent-orange: #ff7519
--blue: #3b82f6
--purple: #a78bfa
--danger: #ef4444
--success: #22c55e
--warning: #f59e0b
```

### Badges de Tipo
```css
.type-badge.feed    { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.type-badge.story   { background: rgba(168, 85, 247, 0.2); color: #a78bfa; }
.type-badge.reel    { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.type-badge.carousel{ background: rgba(34, 197, 94, 0.2); color: #22c55e; }
```

### Hover Effects

**Week view card:**
```css
transform: translateY(-2px);
border-color: var(--accent-orange);
box-shadow: 0 4px 12px rgba(255, 117, 25, 0.2);
```

**Day view post:**
```css
transform: translateX(4px);
border-color: var(--accent-orange);
```

---

## 📱 Responsive

### Desktop (>1400px)
- Semana: 7 columnas
- Día: Thumbnail 150px a la izquierda

### Tablet (1024px - 1400px)
- Semana: 4 columnas
- Día: Thumbnail 120px

### Tablet (768px - 1024px)
- Semana: 3 columnas

### Mobile (<768px)
- Semana: 1 columna (lista vertical)
- Día: Thumbnail arriba (100% width, 200px height)

---

## 🔧 Implementación Técnica

### Archivos

**calendar.js** (nuevo):
- `switchCalendarView(view)` - Cambia entre vistas
- `navigateCalendar(direction)` - Avanza/retrocede
- `renderMonthView()` - Renderiza vista mes
- `renderWeekView()` - Renderiza vista semana
- `renderDayView()` - Renderiza vista día
- `renderPostCard(post)` - Card individual para semana
- `updateCalendarHeader()` - Actualiza texto del header

**app.js** (actualizado):
- `loadCalendar()` - Carga datos del mes
- Mantiene `showPostDetail()` para modal

**styles.css** (nuevo):
- `.week-grid` - Grid de 7 columnas
- `.week-day` - Card de día en semana
- `.post-card` - Card de post en semana
- `.day-post-card` - Card de post en día
- `.type-badge` - Badge de tipo de post
- `.empty-state` - Estado vacío

### Flujo de Datos

```
loadCalendar()
    ↓
[API: /calendar-month?year=2026&month=2]
    ↓
calendarData = [...posts]
    ↓
renderCalendar() → switch(currentCalendarView)
    ↓
renderMonthView() / renderWeekView() / renderDayView()
```

---

## ✨ Mejoras Visuales

### Antes (solo dots)
```
┌─────┐
│  5  │
│ ••• │
└─────┘
```

### Ahora (thumbnails + info)

**Semana:**
```
┌──────────┐
│ [imagen] │
│ 12:00 PM │
│ 📱 Post..│
│ ●        │
└──────────┘
```

**Día:**
```
┌─────────────────────┐
│ ⏰ 12:00 PM         │
│ [img] [info detall.]│
└─────────────────────┘
```

---

## 🚀 Próximas Mejoras

- [ ] Drag & drop para mover posts entre días
- [ ] Vista timeline con horas (8am, 9am, 10am...)
- [ ] Filtros por tipo/plataforma/estado
- [ ] Vista "Próximos 7 días" condensada
- [ ] Preview de imagen en hover (tooltip)
- [ ] Lazy loading de thumbnails
- [ ] Caché de imágenes en localStorage

---

**Fecha:** 2026-02-25  
**Commit:** `51bd264`  
**Branch:** `master`
