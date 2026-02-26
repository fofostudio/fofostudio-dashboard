# 🔐 Configurar Google OAuth - Instrucciones Completas

## ¿Por qué OAuth?

Con OAuth de Google puedes:
- ✅ Acceder a TUS Google Sheets y Drive usando tu cuenta personal
- ✅ No necesitas service account ni permisos especiales
- ✅ Tokens se refrescan automáticamente
- ✅ Más seguro (puedes revocar acceso cuando quieras)

---

## Paso 1: Crear OAuth App en Google Cloud

### 1.1 Ve a Google Cloud Console
Abre: https://console.cloud.google.com

### 1.2 Selecciona o crea un proyecto
- Si ya tienes un proyecto (ej: "grovesecret"), selecciónalo
- Si no, click en "New Project" y créalo

### 1.3 Habilita las APIs necesarias
1. En el menú lateral: **APIs & Services** → **Library**
2. Busca y habilita estas 2 APIs:
   - **Google Sheets API** (click "Enable")
   - **Google Drive API** (click "Enable")

### 1.4 Configura la pantalla de consentimiento OAuth
1. **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (si no eres Google Workspace org)
3. Click **Create**

**Llena el formulario**:
- **App name**: `FofoStudio Dashboard`
- **User support email**: Tu email (ej: `andres0293@gmail.com`)
- **Developer contact**: Tu email
- **Authorized domains** (opcional): `netlify.app`
- Click **Save and Continue**

**Scopes**: Click "Add or Remove Scopes"
- Busca: `https://www.googleapis.com/auth/spreadsheets`
- Busca: `https://www.googleapis.com/auth/drive.readonly`
- Marca ambos
- Click **Update** → **Save and Continue**

**Test users** (si es External):
- Click "Add Users"
- Agrega tu email: `andres0293@gmail.com`
- Click **Save and Continue**

Click **Back to Dashboard**

### 1.5 Crea las credenciales OAuth
1. **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `FofoStudio Dashboard - Netlify`

**Authorized JavaScript origins**:
```
https://f0f0stud1od4shb0ard4ds.netlify.app
```

**Authorized redirect URIs**:
```
https://f0f0stud1od4shb0ard4ds.netlify.app/.netlify/functions/google-auth-callback
https://f0f0stud1od4shb0ard4ds.netlify.app
```

5. Click **Create**

### 1.6 Copia las credenciales
Te mostrará:
- **Client ID**: algo como `123456789-abc...xyz.apps.googleusercontent.com`
- **Client secret**: algo como `GOCSPX-abc...xyz`

**Cópialos** (los necesitarás en el siguiente paso).

---

## Paso 2: Configurar variables en Netlify

Ve a: https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/settings/env

Agrega estas **3 nuevas variables**:

### Variable 1: GOOGLE_CLIENT_ID
```
Valor: <pega tu Client ID aquí>
```
Ejemplo: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### Variable 2: GOOGLE_CLIENT_SECRET
```
Valor: <pega tu Client Secret aquí>
```
Ejemplo: `GOCSPX-AbCdEfGhIjKlMnOpQrSt`

### Variable 3: GOOGLE_REDIRECT_URI
```
Valor: https://f0f0stud1od4shb0ard4ds.netlify.app
```

### Variable 4: GOOGLE_SPREADSHEET_ID (opcional)
```
Valor: <ID de tu spreadsheet de calendarios>
```

**Cómo encontrar el Spreadsheet ID**:
1. Abre tu Google Sheet de calendarios
2. Mira la URL:
   ```
   https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890/edit
                                          ↑ Este es el ID ↑
   ```
3. Copia solo el ID (la parte entre `/d/` y `/edit`)

---

## Paso 3: Re-deploy en Netlify

1. Ve a: https://app.netlify.com/sites/f0f0stud1od4shb0ard4ds/deploys
2. Click **Trigger deploy** → **Deploy site**
3. Espera 1-2 minutos

---

## Paso 4: Prueba el login

1. Abre el dashboard: https://f0f0stud1od4shb0ard4ds.netlify.app/
2. En el header verás un pill que dice **"Google: Login"**
3. Click en el pill
4. Te redirige a Google
5. Selecciona tu cuenta (ej: `andres0293@gmail.com`)
6. Google te pedirá permisos:
   - "Ver, editar, crear y eliminar tus hojas de cálculo"
   - "Ver archivos de Google Drive"
7. Click **Permitir**
8. Te redirige de vuelta al dashboard
9. El pill ahora dice **"Google: ✓"** (verde)

---

## Paso 5: Verifica que funciona

Ahora el calendario debería cargar datos **reales** de tus Google Sheets (si configuraste `GOOGLE_SPREADSHEET_ID`).

Si no configuraste el Spreadsheet ID, seguirá mostrando datos de prueba, pero ya estás autenticado.

---

## 🔒 Seguridad

- ✅ Los tokens se guardan en `localStorage` del navegador (solo tú los ves)
- ✅ Se refrescan automáticamente cada hora
- ✅ Puedes revocar acceso en cualquier momento:
  - Click en el pill verde → "Cerrar sesión"
  - O ve a https://myaccount.google.com/permissions y revoca acceso a "FofoStudio Dashboard"

---

## 🐛 Troubleshooting

### "OAuth error: redirect_uri_mismatch"
- Verifica que agregaste **EXACTAMENTE** la URL en "Authorized redirect URIs" en Google Cloud Console
- Debe ser: `https://f0f0stud1od4shb0ard4ds.netlify.app`

### "Access blocked: This app's request is invalid"
- Verifica que habilitaste Google Sheets API y Google Drive API
- Verifica que agregaste tu email en "Test users" (si OAuth consent screen es External)

### "Token refresh failed"
- Cierra sesión (click en el pill verde) y vuelve a hacer login
- Verifica que `GOOGLE_CLIENT_SECRET` esté correcto en Netlify

### El calendario sigue mostrando datos de prueba
- Verifica que agregaste `GOOGLE_SPREADSHEET_ID` en Netlify
- Verifica que el ID sea correcto (copialo de la URL de tu Sheet)
- Verifica que el Sheet tenga las hojas: "Calendario Marzo 2026" y "Calendario Stories IG"

---

## 📊 Ventajas vs Service Account

| Feature | Service Account | OAuth (Usuario) |
|---------|----------------|-----------------|
| Setup inicial | Complejo (JSON keys) | Simple (click login) |
| Permisos | Manual (compartir sheets) | Automático (tu cuenta) |
| Acceso | Solo sheets compartidos | TODO tu Drive |
| Seguridad | Clave estática | Tokens rotables |
| User experience | Invisible | Login con Google |

**Recomendación**: OAuth es mejor para uso personal. Service Account es mejor para bots automáticos.

---

**¿Listo?** → Configura las variables y prueba el login! 🚀
