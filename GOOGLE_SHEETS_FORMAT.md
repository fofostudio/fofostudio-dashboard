# 📊 Formato de Google Sheets para Calendario

## Estructura Recomendada

El dashboard puede leer **cualquier hoja** de tu spreadsheet automáticamente. Detecta el tipo de contenido por:
1. El nombre de la hoja
2. La columna "Tipo" (si existe)

---

## Opción 1: Separar Feed y Stories en hojas diferentes (Recomendado)

### Hoja 1: "Posts Feed" o "Calendario Marzo 2026"
Para feed posts, reels y carruseles.

### Hoja 2: "Historias" o "Calendario Stories IG"
Para historias/stories.

**Ventaja**: No necesitas columna "Tipo", el sistema detecta automáticamente según el nombre de la hoja.

---

## Opción 2: Todo en una hoja con columna "Tipo"

Una sola hoja con todos los posts, diferenciando por la columna "Tipo".

---

## Columnas Requeridas

El sistema busca columnas por nombre (no importa el orden). Nombres aceptados:

| Dato | Nombres aceptados (case-insensitive) |
|------|--------------------------------------|
| **Fecha** | `Fecha`, `Date`, `Día`, `Dia` |
| **Hora** | `Hora`, `Time`, `Horario` |
| **Título/Copy** | `Título`, `Titulo`, `Title`, `Texto`, `Copy` |
| **Descripción** | `Descripción`, `Descripcion`, `Description`, `Caption` |
| **Tipo** | `Tipo`, `Type`, `Formato`, `Format` |
| **Plataforma** | `Plataforma`, `Platform`, `Red` |
| **Imagen/URL** | `Imagen`, `Image`, `URL`, `Asset`, `Pieza` |

---

## Ejemplo de Hoja (Opción 1: Separadas)

### Hoja: "Posts Feed"

| Fecha | Hora | Título | Descripción | Tipo | Plataforma | Imagen |
|-------|------|--------|-------------|------|------------|--------|
| 2026-03-05 | 12:00 | Tips de diseño | Consejos para UI/UX | Feed | FB + IG | https://... |
| 2026-03-10 | 15:00 | Tutorial Figma | Aprende shortcuts | Reel | Instagram | https://... |
| 2026-03-15 | 14:00 | Tendencias 2026 | 5 tendencias top | Carrusel | Both | https://... |

### Hoja: "Historias IG"

| Fecha | Hora | Título | Descripción | Plataforma | Imagen |
|-------|------|--------|-------------|------------|--------|
| 2026-03-05 | 18:00 | Behind the scenes | Proceso creativo | Instagram | https://... |
| 2026-03-12 | 20:00 | Encuesta | ¿Qué prefieres? | Instagram | https://... |

---

## Ejemplo de Hoja (Opción 2: Todo junto)

### Hoja: "Calendario Completo"

| Fecha | Hora | Título | Descripción | Tipo | Plataforma | Imagen |
|-------|------|--------|-------------|------|------------|--------|
| 2026-03-05 | 12:00 | Tips de diseño | Consejos para UI/UX | **Feed** | FB + IG | https://... |
| 2026-03-05 | 18:00 | Behind the scenes | Proceso creativo | **Story** | Instagram | https://... |
| 2026-03-10 | 15:00 | Tutorial Figma | Aprende shortcuts | **Reel** | Instagram | https://... |
| 2026-03-15 | 14:00 | Tendencias 2026 | 5 tendencias top | **Carrusel** | Both | https://... |

---

## Valores de "Tipo"

Si usas la columna "Tipo", acepta estos valores (case-insensitive):

| Tipo | Valores aceptados | Color en dashboard |
|------|-------------------|-------------------|
| **Feed** | `Feed`, `Post`, `Publicación` | 🔵 Azul |
| **Historia** | `Story`, `Historia` | 🟣 Morado |
| **Reel** | `Reel` | 🟠 Rosa |
| **Carrusel** | `Carousel`, `Carrusel` | 🟡 Ámbar |

---

## Valores de "Plataforma"

| Valor | Muestra en dashboard |
|-------|----------------------|
| `Both`, `FB + IG`, `Ambas` | FB + IG |
| `Facebook`, `FB` | Facebook |
| `Instagram`, `IG` | Instagram |

---

## Formato de Fecha y Hora

### Fecha
**Formato requerido**: `YYYY-MM-DD` (ej: `2026-03-15`)

**Funciona**:
- ✅ `2026-03-05`
- ✅ `2026-3-5` (se interpreta correctamente)

**No funciona**:
- ❌ `05/03/2026` (formato DD/MM/YYYY)
- ❌ `Mar 5, 2026` (formato texto)

**Tip**: En Google Sheets, formatea la columna como "Fecha" o "Texto plano" y escribe en formato ISO.

### Hora
**Formato requerido**: `HH:MM` en formato 24 horas (ej: `14:30`)

**Funciona**:
- ✅ `09:00`
- ✅ `14:30`
- ✅ `21:45`

**También acepta** (se convierte):
- ✅ `9:00` → `09:00`
- ✅ `2:30 PM` → `14:30`

---

## Columna de Imagen/URL

Acepta:
- ✅ URL pública de Google Drive
- ✅ URL directa de imagen (https://example.com/image.jpg)
- ✅ URL de Catbox, Imgur, etc.
- ⚠️ Vacío (muestra "Sin imagen" en el dashboard)

**Cómo compartir desde Drive**:
1. Click derecho en la imagen → Compartir
2. "Cualquiera con el enlace puede ver"
3. Copiar enlace
4. Pegar en la columna

---

## Estado de los Posts

El dashboard calcula el estado automáticamente:

| Estado | Condición |
|--------|-----------|
| **Scheduled** (naranja) | Fecha/hora en el futuro |
| **Published** (verde) | Fecha/hora >2h en el pasado |
| **Error** (rojo) | (reservado para errores de publicación) |

---

## Tips para Organización

### 1. Nombres de Hojas Descriptivos
✅ Bueno:
- "Posts Marzo 2026"
- "Historias Instagram"
- "Feed Facebook"

❌ Malo:
- "Hoja 1"
- "Sheet2"

### 2. Usa Colores en Sheets
Pinta filas por tipo de post:
- Feed → Azul claro
- Stories → Morado claro
- Reels → Rosa claro
- Carrusel → Naranja claro

### 3. Congela la Primera Fila
View → Freeze → 1 row (para que el header siempre sea visible)

### 4. Ordena por Fecha/Hora
Selecciona todo → Data → Sort range → Por Fecha (ascendente)

---

## Ejemplo Real

Tu spreadsheet actual:
```
https://docs.google.com/spreadsheets/d/18FoN5iiPFMX_h0BqIc8KvpS6y-qmd7aKK_pZtDwQUdg/
```

**Hojas detectadas**:
1. Si tienes "Calendario Marzo 2026" → detecta como Feed
2. Si tienes "Calendario Stories IG" → detecta como Stories

**Verifica**:
1. Que las columnas tengan headers (primera fila)
2. Que las fechas estén en formato `YYYY-MM-DD`
3. Que las horas estén en formato `HH:MM`

---

## Troubleshooting

### "No muestra mis posts"
- ✅ Verifica que hiciste login con Google OAuth
- ✅ Verifica que `GOOGLE_SPREADSHEET_ID` está configurado en Netlify
- ✅ Verifica que la fecha está en formato `YYYY-MM-DD`
- ✅ Verifica que estás viendo el mes correcto en el calendario

### "Todos son del mismo tipo"
- ✅ Agrega columna "Tipo" con valores: Feed, Story, Reel, Carrusel
- O separa en hojas diferentes (Posts Feed vs Historias)

### "No carga las imágenes"
- ✅ URLs deben ser públicas (compartidas con "Cualquiera con el enlace")
- ✅ URLs de Google Drive deben terminar en `/view` o `/preview`

### "Hora incorrecta"
- ✅ Verifica que usas formato 24 horas (14:00, no 2:00 PM)
- ✅ En Google Sheets, formatea como "Texto plano" o "Hora"

---

## ¿Necesitas ayuda?

Si el dashboard no lee correctamente tus sheets:
1. Abre Settings → Google Sheets Configuration
2. Verifica que dice "Connected" (verde)
3. Abre la consola (F12) → Console
4. Busca errores que digan "Error reading sheets"
5. Comparte el error conmigo

O comparte una captura de tu hoja (sin datos sensibles) para que pueda verificar el formato.
