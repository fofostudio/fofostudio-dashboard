# 🚀 Setup Completo - Dashboard FofoStudio

## Estado Actual

✅ **Repo GitHub**: https://github.com/fofostudio/fofostudio-dashboard  
✅ **Dashboard Live**: https://f0f0stud1od4shb0ard4ds.netlify.app/  
✅ **Auto-deploy**: Habilitado (cada push a master)

---

## Configuración Necesaria (2 pasos)

### 📊 Paso 1: Meta Ads (LISTO - solo falta agregar variables)

Necesitas agregar en Netlify → Environment variables:

```
META_ACCESS_TOKEN = <tu token actual>
META_AD_ACCOUNT_ID = act_2121667521657775
```

**Dónde**: https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/settings/env

Los valores están en: `CREDENTIALS_FOR_NETLIFY.txt` (archivo local, no en GitHub)

---

### 🔐 Paso 2: Google OAuth (NUEVO - mejor que service account)

Ahora usamos **OAuth** en lugar de service account. Ventajas:
- ✅ Login con tu cuenta de Google (un click)
- ✅ Acceso automático a TODOS tus Sheets y Drive
- ✅ Tokens se refrescan solos
- ✅ Más fácil de configurar

**Instrucciones completas**: Lee `GOOGLE_OAUTH_SETUP.md`

**Resumen rápido**:
1. Ve a Google Cloud Console
2. Habilita Google Sheets API + Google Drive API
3. Crea OAuth 2.0 credentials (Web application)
4. Copia Client ID y Client Secret
5. Agrega estas 3 variables en Netlify:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://f0f0stud1od4shb0ard4ds.netlify.app`
6. Re-deploy
7. Abre el dashboard y click en "Google: Login"

---

## Variables de Entorno - Resumen

En Netlify necesitas configurar **6 variables en total**:

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `META_ACCESS_TOKEN` | Token de Meta Ads | `CREDENTIALS_FOR_NETLIFY.txt` |
| `META_AD_ACCOUNT_ID` | ID de cuenta ads | `CREDENTIALS_FOR_NETLIFY.txt` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | Google Cloud Console (ver `GOOGLE_OAUTH_SETUP.md`) |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Callback URL | `https://f0f0stud1od4shb0ard4ds.netlify.app` |
| `GOOGLE_SPREADSHEET_ID` | ID de tu sheet calendarios | URL de tu Google Sheet (opcional) |

---

## Flujo de Uso

### Primera vez:
1. Configuras las 6 variables en Netlify
2. Re-deploy (Trigger deploy)
3. Abres el dashboard
4. Click en "Google: Login" (en el header)
5. Google te pide permisos
6. Click "Permitir"
7. Vuelves al dashboard (ahora autenticado)

### Después:
1. Abres el dashboard
2. Ya estás autenticado (tokens guardados en localStorage)
3. Si el token expira, se refresca automáticamente
4. Puedes cerrar sesión click en el pill verde

---

## Verificación

Una vez configurado todo, verifica:

✅ **Meta Ads funciona**: Las métricas muestran valores reales (no 0)  
✅ **Campañas cargan**: Ves tu lista de campañas  
✅ **Google autenticado**: Pill dice "Google: ✓" (verde)  
✅ **Calendario real**: Si configuraste `GOOGLE_SPREADSHEET_ID`, ves tus posts reales  
✅ **No hay errores**: Consola del navegador (F12) sin errores 400/500

---

## Archivos de Ayuda

| Archivo | Para qué sirve |
|---------|----------------|
| `QUICK_START.md` | Inicio rápido (si ya sabes qué hacer) |
| `GOOGLE_OAUTH_SETUP.md` | Instrucciones paso a paso OAuth ⭐ |
| `ENVIRONMENT_VARIABLES.md` | Lista completa de variables |
| `DEPLOY_NETLIFY.md` | Deploy desde cero (si empiezas de 0) |
| `CREDENTIALS_FOR_NETLIFY.txt` | Valores reales Meta Ads (LOCAL, no en GitHub) |

---

## Próximos Pasos (opcional)

### Dominio Custom
Puedes cambiar `f0f0stud1od4shb0ard4ds.netlify.app` por:
- `dashboard.fofostudio.com`
- `ads.fofostudio.com`
- Lo que quieras

**Cómo**:
1. Netlify → Domain management → Add custom domain
2. Sigue las instrucciones (agregar DNS records)

### Notificaciones
Configura webhooks para recibir avisos cuando:
- Una campaña excede budget
- Un post se publica
- Errores en functions

### Analytics
Agrega Google Analytics o Netlify Analytics para ver:
- Cuántas veces abres el dashboard
- Qué funciones usas más
- Errores que ocurren

---

## 🐛 Si algo falla

1. **Revisa las variables**: Netlify → Settings → Environment variables
2. **Chequea los logs**: Netlify → Functions → [función] → Logs
3. **Consola del navegador**: F12 → Console (errores en rojo)
4. **Re-deploy**: A veces ayuda hacer un deploy limpio

---

**¿Todo listo?** → Sigue `GOOGLE_OAUTH_SETUP.md` para configurar OAuth y tendrás acceso completo a tus Sheets 🚀
