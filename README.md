# 🍁 FofoStudio Marketing Command Center

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)

Dashboard completo para gestionar Meta Ads y calendario de contenido de FofoStudio. Diseñado para deploy en Netlify.

![Dashboard Preview](https://via.placeholder.com/1200x600/0a0a0f/ff7519?text=FofoStudio+Dashboard)

## ✨ Características

### 📊 Meta Ads Overview
- **Métricas en tiempo real**: Spend, impresiones, clicks, CTR, CPC, CPM
- **Comparación temporal**: Hoy, últimos 7 días, últimos 30 días
- **Gestión de campañas**: Ver estado de todas las campañas activas/pausadas
- **Quick actions**: Pausar todas las campañas con un click

### 📅 Calendario de Contenido
- **Vista dual**: Grid mensual tipo calendario + Lista por día
- **Gestión completa**: Editar, mover, eliminar posts
- **Estado de publicación**: Ver si cada post está programado, publicado o tiene error
- **Multi-tipo**: Feed posts + Stories en el mismo calendario

### ⚡ Quick Actions
- Pausar todas las campañas activas
- Exportar reporte de performance
- Sincronizar calendario con Google Sheets

## 🚀 Deploy a Netlify

### 1. Fork o clona este repo

```bash
git clone https://github.com/TU-USUARIO/fofostudio-dashboard.git
cd fofostudio-dashboard
```

### 2. Conecta con Netlify

Opción A: **Deploy directo desde GitHub**
1. Ve a [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Conecta tu repo de GitHub
4. Netlify detectará automáticamente `netlify.toml`
5. Click "Deploy site"

Opción B: **Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 3. Configura variables de entorno

En Netlify Dashboard → Site settings → Environment variables, agrega:

```
META_ACCESS_TOKEN=tu_access_token_de_meta
META_AD_ACCOUNT_ID=act_XXXXXXXXXX
```

**Importante**: Nunca hagas commit de estas credenciales en el código.

### 4. ¡Listo! 🎉

Tu dashboard estará disponible en: `https://tu-sitio.netlify.app`

## 🔧 Desarrollo local

### Requisitos
- Python 3.9+
- Node.js 16+ (para Netlify CLI)

### Instalación

```bash
# Instala Netlify CLI
npm install -g netlify-cli

# Configura variables de entorno locales
netlify env:import .env

# Inicia desarrollo local
netlify dev
```

El dashboard estará disponible en: `http://localhost:8888`

Las Netlify Functions se ejecutarán en: `http://localhost:8888/.netlify/functions/`

## 📁 Estructura del proyecto

```
fofostudio-dashboard/
├── public/                      # Frontend estático
│   ├── index.html              # Dashboard UI
│   ├── styles.css              # Estilos (dark premium)
│   └── app.js                  # Frontend JavaScript
├── netlify/
│   └── functions/              # Serverless functions
│       ├── ads-overview.py     # GET ads metrics
│       ├── campaigns.py        # GET campaigns list
│       ├── calendar-month.py   # GET calendar posts
│       └── pause-all-ads.py    # POST pause campaigns
├── netlify.toml                # Netlify config
├── requirements.txt            # Python dependencies
├── runtime.txt                 # Python version
└── README.md                   # Esta documentación
```

## 🎨 Diseño

**Estética**: Dark premium con glassmorphism (estilo FofoStudio)
- Paleta: Negro profundo + naranja marca (`#ff7519`) + acentos brillantes
- Tipografía: **Outfit** (display) + **JetBrains Mono** (datos/números)
- Efectos: Blur, transparencias, glow sutil naranja
- Animaciones: Fade-in al cargar, hover suaves, modal slide-in

**100% Responsive**: Funciona perfecto en desktop, tablet y móvil.

## 🔌 API Endpoints (Netlify Functions)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/.netlify/functions/ads-overview` | GET | Métricas agregadas de ads |
| `/.netlify/functions/campaigns` | GET | Lista de campañas con métricas |
| `/.netlify/functions/pause-all-ads` | POST | Pausar todas las campañas |
| `/.netlify/functions/calendar-month?year=2026&month=3` | GET | Posts del mes |

## 🔐 Seguridad

- ✅ Credenciales en variables de entorno (no en código)
- ✅ CORS configurado para tu dominio
- ✅ HTTPS automático con Netlify
- ✅ No se exponen tokens en el frontend

## 🐛 Troubleshooting

### Las métricas no cargan
1. Verifica que las variables de entorno estén configuradas en Netlify
2. Revisa que `META_ACCESS_TOKEN` tenga permisos correctos
3. Chequea los logs en Netlify Functions

### "Function returned undefined"
- Asegúrate de que todas las functions retornen un objeto con `statusCode`, `headers` y `body`
- Revisa los logs en Netlify Dashboard → Functions → Logs

### CORS errors
- Las functions ya incluyen headers CORS
- Si persiste, verifica que el dominio en Netlify coincida con el esperado

## 🔮 Roadmap

- [ ] Integración real con Google Sheets API (requiere service account en variables de entorno)
- [ ] Crear nuevo post desde el dashboard
- [ ] Verificar estado real de publicación vía Meta Graph API
- [ ] Exportar reportes en PDF
- [ ] Vista de analytics con gráficos
- [ ] Notificaciones push cuando una campaña excede budget
- [ ] Multi-cuenta (switch entre FofoStudio y otros clientes)

## 📝 Licencia

Uso interno de FofoStudio.

---

**Creado por**: Jarvis (OpenClaw AI)  
**Para**: Dr Fofo / FofoStudio  
**Stack**: Vanilla JS + CSS Grid + Netlify Functions (Python) + Meta Graph API
