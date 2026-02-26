# 📊 Detalle de Campañas

## 🎯 Nueva Funcionalidad

Click en cualquier campaña del listado para ver todos sus detalles, anuncios y creativos expandidos abajo.

---

## 🚀 Cómo Usar

### 1. Ir a Tab Pautas
```
[📊 Pautas] [📅 Calendario] [🗂️ Bóveda]
     ↑
  Activo
```

### 2. Click en Campaña
Cualquier campaña de la lista es ahora **clickeable**.

```
┌─────────────────────────────────────┐
│ Campaña de Tráfico 2024            │  ← Click aquí
│ TRAFFIC                             │
│ Spend: $80,861  CTR: 0.66%         │
│ [ACTIVE]                            │
└─────────────────────────────────────┘
```

### 3. Ver Detalle Expandido
Aparece debajo del listado con:
- ✅ **Métricas completas** de la campaña
- ✅ **Todos los anuncios** de la campaña
- ✅ **Creativos** (imagen + copy)
- ✅ **Métricas por anuncio**

---

## 📋 Información Mostrada

### Métricas de Campaña (Grid 6 columnas)

```
┌───────┬───────────┬───────┬──────┬──────┬──────┐
│ Spend │Impresiones│Clicks │ CTR  │ CPC  │ CPM  │
│$80,861│  66,234   │  440  │0.66% │ $184 │$1,221│
└───────┴───────────┴───────┴──────┴──────┴──────┘
```

### Lista de Anuncios

Para cada anuncio:

```
┌──────────────────────────────────────────────┐
│ Anuncio - Promoción Verano        [ACTIVE]  │
├──────────────────────────────────────────────┤
│ ┌────────┐  Título: Verano 2024             │
│ │[IMAGE] │  Copy: Aprovecha descuentos...   │
│ │        │                                   │
│ └────────┘                                   │
├──────────────────────────────────────────────┤
│ Spend     Clicks    CTR      CPC             │
│ $12,450   125       1.2%     $99.60          │
└──────────────────────────────────────────────┘
```

**Elementos:**
- 🖼️ **Imagen del creativo** (si existe)
- 📝 **Título** del ad
- 💬 **Body/copy** del mensaje
- 📊 **4 métricas**: Spend, Clicks, CTR, CPC
- 🟢/🟡 **Status badge** (ACTIVE/PAUSED)

---

## 🎨 Visual Design

### Header
```
┌──────────────────────────────────────────┐
│ 📊 Campaña de Tráfico 2024    [Cerrar ✕]│
└──────────────────────────────────────────┘
```

### Grid de Métricas
- Responsive: auto-fit, min 150px
- Background: rgba(255,255,255,0.03)
- Border radius: 12px
- Texto centrado

### Ad Cards
- Background hover effect
- Creative image: 100x100px, border-radius 8px
- Métricas en grid 4 columnas
- Border-top separator

---

## 🔧 Flujo Técnico

### Frontend

**1. Click en campaña**
```javascript
showCampaignDetail(campaignId)
  → Mostrar loading
  → Fetch /campaign-detail?campaign_id={id}
  → Renderizar resultado
```

**2. Click de nuevo en misma campaña**
```javascript
→ Cerrar detalle (toggle)
```

**3. Click botón "Cerrar"**
```javascript
closeCampaignDetail()
  → Limpiar container
  → Reset selectedCampaignId
```

### Backend

**Endpoint:** `GET /campaign-detail?campaign_id={id}`

**Proceso:**
1. Fetch campaign data + insights de Meta API
2. Fetch ads de la campaña
3. Para cada ad:
   - Obtener creative (title, body, image)
   - Obtener insights (spend, clicks, CTR, CPC)
4. Combinar todo en respuesta

**Meta API Calls:**
```javascript
// Campaign
GET /{campaign_id}?fields=name,objective,status,spend,...

// Campaign insights
GET /{campaign_id}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm

// Ads
GET /{campaign_id}/ads?fields=id,name,status,creative{...},insights{...}
```

**Response:**
```json
{
  "campaign": {
    "id": "123",
    "name": "Campaña de Tráfico",
    "objective": "TRAFFIC",
    "status": "ACTIVE",
    "spend": 80861,
    "impressions": 66234,
    "clicks": 440,
    "ctr": 0.66,
    "cpc": 183.77,
    "cpm": 1220.84
  },
  "ads": [
    {
      "id": "456",
      "name": "Anuncio 1",
      "status": "ACTIVE",
      "creative": {
        "title": "Título del ad",
        "body": "Copy del mensaje",
        "image_url": "https://..."
      },
      "spend": 12450,
      "clicks": 125,
      "impressions": 8000,
      "ctr": 1.56,
      "cpc": 99.60
    }
  ],
  "ads_count": 3
}
```

---

## 📊 Datos Mostrados

### Campaña
- ✅ Nombre
- ✅ Objetivo (TRAFFIC, CONVERSIONS, etc.)
- ✅ Status (ACTIVE, PAUSED)
- ✅ Spend total
- ✅ Impresiones totales
- ✅ Clicks totales
- ✅ CTR promedio
- ✅ CPC promedio
- ✅ CPM promedio

### Anuncios
- ✅ Nombre del ad
- ✅ Status del ad
- ✅ Creative:
  - Título
  - Body/mensaje
  - Imagen/thumbnail
- ✅ Métricas:
  - Spend
  - Clicks
  - CTR
  - CPC

---

## 🎯 Casos de Uso

### 1. Auditoría Rápida
- Ver qué ads están activos
- Comparar rendimiento entre ads
- Identificar creativos con mejor CTR

### 2. Optimización
- Pausar ads con bajo rendimiento
- Duplicar ads con alto CTR
- Actualizar copy de underperformers

### 3. Reporte
- Screenshot del detalle completo
- Compartir métricas con cliente
- Documentar estado de campaña

---

## ⚠️ Limitaciones Actuales

- ❌ No se puede editar desde aquí (solo vista)
- ❌ No botones de acción (pausar/activar ad)
- ⚠️ Solo muestra primeros N ads (no paginación)

---

## 🔮 Mejoras Futuras

- [ ] Botones de acción en ads (pause/activate)
- [ ] Editar budget desde detalle
- [ ] Gráficos de tendencia temporal
- [ ] Comparación con período anterior
- [ ] Export a PDF/CSV
- [ ] Preview de landing page
- [ ] Historial de cambios
- [ ] A/B test comparisons

---

## 🐛 Troubleshooting

### No aparece detalle
- **Causa:** Error de API o permisos
- **Solución:** Revisar console (F12) para error específico

### Creativos sin imagen
- **Causa:** Ad sin creative o URL inválida
- **Solución:** Normal, algunos ads son solo texto

### Loading infinito
- **Causa:** Timeout de Meta API
- **Solución:** Refrescar página, reintentar

---

## 📱 Responsive

### Desktop
- Grid 6 columnas para métricas
- Ad cards con imagen a la izquierda

### Tablet
- Grid 3 columnas para métricas
- Ad cards stacked

### Mobile
- Grid 2 columnas para métricas
- Creative imagen arriba

---

**Fecha:** 2026-02-25  
**Commit:** `a93ddf5`  
**Endpoint:** `/campaign-detail`  
**Frontend:** `showCampaignDetail()` en `app.js`
