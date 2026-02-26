# 🗂️ Sistema de Tabs - Dashboard FofoStudio

## 📋 Resumen

El dashboard ahora está organizado en **3 tabs principales** para mejor navegación y separación de funcionalidades:

1. **📊 Pautas** - Gestión de campañas publicitarias
2. **📅 Calendario** - Planificación de contenido
3. **🗂️ Bóveda de Contenido** - Assets y recursos visuales

---

## 1. 📊 TAB: PAUTAS

### Sección Principal: Campañas Activas
- **Métricas globales** (Spend, Impresiones, Clicks, CTR, CPC, CPM)
- **Lista de campañas** con estado y rendimiento
- **Filtro por timeframe** (Hoy, 7 días, 30 días)
- **Botón refresh** para actualizar datos

### Sidebar: Recomendaciones 💡

Sistema inteligente que analiza tus campañas y sugiere acciones:

#### Tipos de Recomendaciones

**🧹 Limpieza de campañas pausadas** (Medium Priority)
- Detecta cuando tienes muchas campañas pausadas
- **Acción:** Archivar automáticamente campañas pausadas

**⚠️ Sin campañas activas** (High Priority)
- Alerta si no tienes ninguna campaña corriendo
- **Acción:** Te recuerda activar una campaña

**💰 Presupuesto bajo** (Medium Priority)
- Detecta campañas con presupuesto diario < $50k COP
- **Acción:** Sugiere aumentar presupuesto

**📉 CTR bajo** (High Priority)
- Alerta cuando CTR < 0.5%
- **Acción:** Revisión manual de creativos y copy

**💸 CPC alto** (Medium Priority)
- Alerta cuando CPC > $500 COP
- **Acción:** Optimización de segmentación

**🔍 Auditoría mensual** (Low Priority)
- Recordatorio general de mejores prácticas
- **Acción:** Programar revisión periódica

#### Botones de Acción

Cada recomendación tiene 2 botones:

1. **Ejecutar** (naranja) → Aplica la acción automáticamente
2. **Descartar** (gris) → Oculta la recomendación

#### Flujo de Ejecución

```
1. Usuario ve recomendación
2. Click en "Ejecutar"
3. Confirmación de acción
4. Backend ejecuta cambios en Meta API
5. Feedback de éxito/error
6. Recarga campañas y recomendaciones
```

---

## 2. 📅 TAB: CALENDARIO

### Sección Principal: Vista de Calendario

Lo mismo que ya existía, pero ahora aislado en su propio tab:

- **Vista Grid** → Calendario mensual con dots
- **Vista Lista** → Posts agrupados por día
- **Navegación mes a mes** (← →)
- **Leyenda de colores** (Feed, Story, Reel, Carrusel)
- **Click en post** → Modal con detalles

### Sidebar: Acciones Rápidas

- **+ Nuevo Post**
- **🔄 Sync Sheets** → Sincronizar con Google Sheets
- **📥 Export Report** → Descargar reporte
- **Actividad reciente** → Log de acciones

---

## 3. 🗂️ TAB: BÓVEDA DE CONTENIDO

### Sección Principal: Galería de Assets

**Grid de assets** desde Google Drive:

- **Thumbnails automáticos** de imágenes/videos
- **Metadata** (tipo, tamaño, fecha)
- **Hover effect** con borde naranja
- **Click** → Ver detalles del asset

### Filtros Disponibles

```javascript
- Todos       → Root folder completo
- Feed        → Assets de feed posts
- Stories     → Assets de stories
- Logos       → Logos de marca
- Fotos       → Fotos del equipo/oficina
```

### Sidebar: Info del Asset

Cuando seleccionas un asset:
- Preview ampliado
- Nombre completo
- Tipo de archivo
- Tamaño
- Fecha de creación
- URL directa

**Próximamente:**
- Copiar URL
- Descargar
- Usar en nuevo post
- Mover a otra carpeta

---

## 🔧 Implementación Técnica

### Frontend

**index.html:**
```html
<nav class="tabs-nav">
  <button class="tab-btn active" data-tab="pautas">...</button>
  <button class="tab-btn" data-tab="calendario">...</button>
  <button class="tab-btn" data-tab="boveda">...</button>
</nav>

<div class="tab-content active" id="tab-pautas">...</div>
<div class="tab-content" id="tab-calendario">...</div>
<div class="tab-content" id="tab-boveda">...</div>
```

**app.js:**
```javascript
function switchTab(tabName) {
  // Update active tab button
  // Show/hide tab content
  // Load tab-specific data
}
```

**styles.css:**
```css
.tabs-nav { /* Glassmorphism nav bar */ }
.tab-btn.active { /* Orange gradient */ }
.tab-content { display: none; }
.tab-content.active { display: block; }
```

### Backend Endpoints

**1. GET /recommendations**
```javascript
// Analiza campañas
// Genera recomendaciones basadas en:
//   - Cantidad de pausadas/activas
//   - CTR promedio
//   - CPC promedio
//   - Presupuestos
// Retorna array de recommendations
```

**2. POST /execute-recommendation**
```javascript
// Recibe recommendation_id
// Ejecuta acción correspondiente:
//   - Archivar pausadas
//   - Sugerir presupuesto
//   - Guía manual
// Retorna resultado de ejecución
```

**3. GET /assets?filter=all|feed|stories|logos|photos**
```javascript
// Lee Google Drive con OAuth
// Filtra por carpeta según filter
// Retorna array de assets con thumbnails
```

---

## 🚀 Próximas Mejoras

### Pautas
- [ ] Gráficos de tendencia (Chart.js)
- [ ] Comparación período anterior
- [ ] Recomendaciones con IA (Claude)
- [ ] Creación de campaña desde dashboard

### Calendario
- [ ] Drag & drop para reprogramar
- [ ] Vista semanal
- [ ] Preview de imagen en hover
- [ ] Edición inline

### Bóveda
- [ ] Upload desde dashboard
- [ ] Organizar en carpetas
- [ ] Búsqueda por nombre/tipo
- [ ] Generación de piezas con IA
- [ ] Integración con Nanobanana

---

## 📊 Estado Actual

- ✅ Tabs navegación implementada
- ✅ Recomendaciones básicas funcionando
- ✅ Ejecución de acciones en Meta API
- ✅ Bóveda lista assets de Drive
- ⏳ Requiere OAuth de Google configurado
- ⏳ Probar ejecución de recomendaciones

---

**Fecha:** 2026-02-25  
**Commit:** `f0f18a4`  
**Branch:** `master`
