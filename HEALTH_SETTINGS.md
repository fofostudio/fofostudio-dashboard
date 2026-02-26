# ⚙️ Health & Settings Panel

El dashboard ahora incluye un panel completo de **Health & Settings** que te permite:

✅ Ver el estado de todas las integraciones en tiempo real  
✅ Monitorear la conexión con Meta Ads  
✅ Monitorear la conexión con Google OAuth, Sheets y Drive  
✅ Ver configuraciones actuales  
✅ Acceder a guías de configuración

---

## 🏥 Health Overview

El panel muestra el estado de 4 servicios principales:

### 1. Meta Ads
- **Connected** (Verde): API conectada correctamente
  - Muestra nombre de la cuenta
  - Muestra estado de la cuenta
- **Not Configured** (Rojo): Falta configurar `META_ACCESS_TOKEN` o `META_AD_ACCOUNT_ID`
- **Error** (Rojo): Token inválido o expirado

### 2. Google OAuth
- **Connected** (Verde): Usuario autenticado con Google
  - Muestra email del usuario
- **Not Authenticated** (Amarillo): OAuth configurado pero usuario no logueado
- **Not Configured** (Rojo): Falta configurar OAuth credentials

### 3. Google Sheets
- **Connected** (Verde): Acceso a spreadsheet configurado
  - Muestra título del spreadsheet
- **Warning** (Amarillo): No hay Spreadsheet ID configurado (usa datos de prueba)
- **Not Authenticated** (Rojo): No hay sesión de Google activa
- **Error** (Rojo): No se puede acceder al spreadsheet

### 4. Google Drive
- **Connected** (Verde): Acceso a Drive funcionando
  - Muestra espacio usado y límite de almacenamiento
- **Not Authenticated** (Rojo): No hay sesión de Google activa
- **Error** (Rojo): No se puede acceder a Drive

---

## 🎯 Cómo Acceder

1. Abre el dashboard: https://f0f0stud1od4shb0ard4ds.netlify.app/
2. En el sidebar derecho, click en **"⚙️ Settings"** (en Quick Actions)
3. Se abre el modal de Settings & Health

---

## 📊 Secciones del Panel

### System Health
Grid visual con el estado de todos los servicios:
- Indicador verde/amarillo/rojo
- Estado (Connected, Warning, Error, etc.)
- Mensaje descriptivo

### Meta Ads Configuration
- **Access Token**: Muestra si está configurado (oculto por seguridad)
- **Ad Account ID**: ID de tu cuenta de ads
- **Account Name**: Nombre de la cuenta (si conectado)
- **Account Status**: Estado de la cuenta (ACTIVE, etc.)

**Nota**: Los tokens se configuran en Netlify Environment Variables (no editables desde el dashboard por seguridad).

### Google OAuth Configuration
- **Client ID**: Muestra si está configurado
- **Client Secret**: Muestra si está configurado (oculto)
- **Redirect URI**: URL de callback
- **Logged in as**: Email del usuario autenticado (si está logueado)
- **Botón Login/Logout**: Click para autenticarte o cerrar sesión

### Google Sheets Configuration
- **Spreadsheet ID**: ID del spreadsheet de calendarios
- **Spreadsheet Title**: Nombre del spreadsheet (si conectado)
- **Guía**: Cómo encontrar el Spreadsheet ID en la URL

### Google Drive Configuration
- **Storage Used**: Espacio utilizado en GB
- **Storage Limit**: Límite de almacenamiento en GB

### Environment Variables Guide
- Lista de todas las variables requeridas
- Link directo a Netlify para configurarlas
- Link a guías de setup (GitHub)

---

## 🔧 Configurar Variables de Entorno

Todas las configuraciones sensibles (tokens, secrets) se configuran en **Netlify Environment Variables**.

### Paso 1: Ve a Netlify
https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/settings/env

### Paso 2: Agrega las Variables

**Para Meta Ads:**
```
META_ACCESS_TOKEN = <tu token>
META_AD_ACCOUNT_ID = act_XXXXXXXXXX
```

**Para Google OAuth:**
```
GOOGLE_CLIENT_ID = <tu client id>
GOOGLE_CLIENT_SECRET = <tu client secret>
GOOGLE_REDIRECT_URI = https://f0f0stud1od4shb0ard4ds.netlify.app
```

**Para Google Sheets (opcional):**
```
GOOGLE_SPREADSHEET_ID = <id de tu spreadsheet>
```

### Paso 3: Re-deploy
1. Ve a: https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/deploys
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Espera 1-2 minutos

### Paso 4: Verifica en el Dashboard
1. Abre Settings → System Health
2. Todos los servicios deberían mostrar estado verde (Connected)

---

## 🔐 Seguridad

### ¿Por qué no son editables desde el dashboard?

**Variables de entorno (tokens, secrets) NO son editables desde el UI por seguridad:**

✅ **Ventajas**:
- No expone tokens en el frontend (localStorage no es seguro para secrets)
- No hay riesgo de que alguien con acceso al dashboard robe credenciales
- Cambios requieren re-deploy (previene cambios accidentales)
- Netlify encripta las variables de entorno

❌ **Si fueran editables desde el UI**:
- Tokens quedarían en localStorage (vulnerable a XSS)
- Cualquiera con acceso al dashboard podría robarlos
- Más vectores de ataque

### ¿Qué sí es editable?

Desde el dashboard puedes:
- ✅ **Ver** el estado de las configuraciones
- ✅ **Login/Logout** de Google OAuth
- ✅ **Ver** qué variables están configuradas (sin ver valores)
- ✅ **Acceder** a guías para configurar variables

---

## 🔄 Flujo Recomendado

### Primera Configuración:
1. **Configura Meta Ads**:
   - Agrega `META_ACCESS_TOKEN` y `META_AD_ACCOUNT_ID` en Netlify
   - Re-deploy
   - Verifica en Settings que aparece "Connected"

2. **Configura Google OAuth**:
   - Sigue `GOOGLE_OAUTH_SETUP.md`
   - Agrega `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - Re-deploy
   - En el dashboard, click "Login with Google"
   - Autoriza permisos

3. **Configura Google Sheets** (opcional):
   - Agrega `GOOGLE_SPREADSHEET_ID` en Netlify
   - Re-deploy
   - Verifica que carga tus calendarios reales

### Uso Diario:
1. Abre el dashboard
2. Si algo falla, abre Settings → System Health
3. Revisa qué servicio está en rojo/amarillo
4. Sigue las instrucciones del mensaje de error

---

## 🐛 Troubleshooting

### Meta Ads muestra "Error"
- Verifica que `META_ACCESS_TOKEN` sea válido
- Verifica que `META_AD_ACCOUNT_ID` sea correcto (debe empezar con `act_`)
- Genera un nuevo token en Facebook Developers si expiró

### Google OAuth muestra "Not Configured"
- Verifica que agregaste las 3 variables en Netlify
- Verifica que `GOOGLE_REDIRECT_URI` coincida exactamente con tu URL de Netlify
- Verifica que habilitaste Google Sheets API y Google Drive API en Google Cloud Console

### Google Sheets muestra "Warning"
- Agrega `GOOGLE_SPREADSHEET_ID` en Netlify
- Copia el ID desde la URL de tu Google Sheet
- Re-deploy

### No puedo hacer login con Google
- Abre Settings → Google OAuth Configuration
- Si dice "Not Configured", sigue `GOOGLE_OAUTH_SETUP.md`
- Si dice "Not Authenticated", click en el botón "Login with Google"
- Verifica que agregaste tu email en "Test users" (si OAuth consent screen es External)

---

## 📈 Próximas Mejoras

- [ ] Botón "Test Connection" para cada servicio
- [ ] Logs de últimas actividades por servicio
- [ ] Alertas cuando algo falla
- [ ] Export de configuraciones (sin secrets)
- [ ] Guía de troubleshooting integrada

---

**¿Dudas?** → Revisa `SETUP_COMPLETO.md` para la guía completa de configuración.
