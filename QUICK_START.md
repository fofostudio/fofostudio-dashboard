# 🚀 Quick Start - Dashboard FofoStudio

## ✅ El dashboard ya está desplegado

**URL actual**: https://f0f0stud1od4shb0ard4ds.netlify.app/

## 🔧 Para que funcione completamente:

### 1️⃣ Configurar variables de entorno en Netlify

Lee el archivo **`CREDENTIALS_FOR_NETLIFY.txt`** (está en esta carpeta, NO se sube a GitHub).

Copia las 3 variables en Netlify:
1. Ve a https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/settings/env
2. Click "Add a variable"
3. Agrega cada una de las 3 variables del archivo

**Variables necesarias**:
- ✅ `META_ACCESS_TOKEN` — Token de Meta Ads
- ✅ `META_AD_ACCOUNT_ID` — ID de cuenta de ads
- ✅ `GOOGLE_SERVICE_ACCOUNT` — Credenciales de Google Sheets (JSON completo)

### 2️⃣ Re-deploy

Después de agregar las variables:
1. Ve a https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/deploys
2. Click "Trigger deploy" → "Deploy site"
3. Espera 1-2 minutos

### 3️⃣ Verificar que funciona

Abre el dashboard: https://f0f0stud1od4shb0ard4ds.netlify.app/

Deberías ver:
- ✅ Métricas de Meta Ads (no 0)
- ✅ Lista de campañas
- ✅ Calendario con posts (mock data por ahora)
- ✅ No errores 400 en la consola del navegador

---

## 📁 Archivos importantes

| Archivo | Descripción |
|---------|-------------|
| `CREDENTIALS_FOR_NETLIFY.txt` | 🔐 Credenciales reales (NO se sube a GitHub) |
| `ENVIRONMENT_VARIABLES.md` | 📖 Documentación de las variables |
| `DEPLOY_NETLIFY.md` | 📚 Instrucciones completas de deploy |
| `README.md` | 📘 Documentación general del proyecto |

---

## 🎨 Características del dashboard

### 📊 Meta Ads Overview
- Métricas en tiempo real (Spend, CTR, CPC, CPM)
- Timeframes: Hoy, 7 días, 30 días
- Lista de campañas activas/pausadas

### 📅 Calendario de Contenido
- Vista grid mensual
- Vista lista por día
- Edición de posts (próximamente)
- Estado: scheduled/published/error

### ⚡ Quick Actions
- Pausar todas las campañas
- Sync calendario
- Export reporte (próximamente)

---

## 🔮 Próximos pasos (opcional)

1. **Dominio custom**: Configura `dashboard.fofostudio.com` en Netlify
2. **Spreadsheet real**: Agrega `GOOGLE_SPREADSHEET_ID` para ver tus calendarios reales
3. **Notificaciones**: Configura webhooks para avisos de budget

---

## 🐛 Si algo no funciona

1. Revisa que las 3 variables estén en Netlify
2. Chequea los logs: Netlify → Functions → Selecciona función → Logs
3. Abre consola del navegador (F12) y busca errores

---

**¿Todo listo?** → Abre https://f0f0stud1od4shb0ard4ds.netlify.app/ y disfruta tu dashboard 🍁
