# 🔐 Variables de Entorno para Netlify

## Variables requeridas

Ve a tu sitio en Netlify → **Site settings** → **Environment variables** → **Add a variable**

### 1. Meta Ads API

```
META_ACCESS_TOKEN
```
**Valor**: Tu Page Access Token de Meta Graph API
- Obtenlo de Facebook Developers → Graph API Explorer
- Debe tener permisos: `ads_read`, `ads_management`, `pages_read_engagement`

---

```
META_AD_ACCOUNT_ID
```
**Valor**: `act_XXXXXXXXXX` (tu ID de cuenta de ads)
- Encuéntralo en Meta Business Suite → Business settings → Ad accounts

---

### 2. Google OAuth (Recomendado)

**Para Google Drive & Sheets, ahora usamos OAuth** (login con tu cuenta personal).

Ver instrucciones completas en: **`GOOGLE_OAUTH_SETUP.md`**

Variables requeridas:

```
GOOGLE_CLIENT_ID
```
**Valor**: Client ID de tu OAuth app en Google Cloud Console

```
GOOGLE_CLIENT_SECRET
```
**Valor**: Client Secret de tu OAuth app

```
GOOGLE_REDIRECT_URI
```
**Valor**: `https://f0f0stud1od4shb0ard4ds.netlify.app`

---

### 3. Google Spreadsheet ID (opcional pero recomendado)

```
GOOGLE_SPREADSHEET_ID
```
**Valor**: El ID de tu spreadsheet de Google Sheets

**Cómo encontrarlo**: En la URL de tu spreadsheet:
```
https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890/edit
                                      ↑ Este es el ID ↑
```

Si no configuras esto, el dashboard mostrará datos de prueba (mock data).

---

## 📝 Cómo agregar las variables en Netlify

1. Ve a tu sitio en Netlify Dashboard
2. Click en **Site settings**
3. En el menú lateral, click en **Environment variables**
4. Click en **Add a variable**
5. Pega el nombre de la variable (ej: `META_ACCESS_TOKEN`)
6. Pega el valor completo
7. Click en **Create variable**
8. Repite para cada variable

## 🔄 Re-deploy después de agregar variables

Una vez agregadas todas las variables:

1. Ve a **Deploys**
2. Click en **Trigger deploy** → **Deploy site**

Netlify reconstruirá el sitio con las nuevas variables de entorno.

---

## ✅ Verificación

Después del deploy, abre el dashboard y verifica:

- ✅ Las métricas de Meta Ads cargan (no muestran 0)
- ✅ Las campañas aparecen listadas
- ✅ El calendario muestra posts (mock data o real si configuraste Sheets)
- ✅ No hay errores 400/500 en la consola del navegador

---

## 🔐 Seguridad

- ✅ Las variables de entorno están encriptadas en Netlify
- ✅ No se exponen en el frontend (solo en las functions del backend)
- ✅ No están en el código fuente de GitHub
- ✅ Puedes rotarlas sin cambiar código

---

**Nota**: Por seguridad, NUNCA hagas commit de credenciales reales en el código. Siempre usa variables de entorno.

---

## 📧 ¿Necesitas las credenciales configuradas?

Contacta a Dr Fofo - él tiene las credenciales reales guardadas de forma segura.
