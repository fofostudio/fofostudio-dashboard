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

### 2. Google Sheets API (Service Account)

```
GOOGLE_SERVICE_ACCOUNT
```
**Valor**: JSON completo de tu service account credentials (en UNA sola línea)

**Formato**:
```json
{"type":"service_account","project_id":"tu-proyecto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

**Cómo obtenerlo**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. IAM & Admin → Service Accounts
4. Crea un service account (o usa uno existente)
5. Click en el service account → Keys → Add Key → Create new key → JSON
6. Descarga el JSON
7. Copia TODO el contenido y pégalo en UNA línea (sin saltos de línea)

---

### 3. Google Spreadsheet ID (opcional)

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
