# 🚀 Deploy a Netlify - Instrucciones

## Opción 1: Deploy desde GitHub (Recomendado)

### Paso 1: Ve a Netlify
Entra a [https://app.netlify.com](https://app.netlify.com) y haz login.

### Paso 2: Nuevo sitio desde Git
1. Click en **"Add new site"** → **"Import an existing project"**
2. Selecciona **GitHub**
3. Autoriza a Netlify si es necesario
4. Busca y selecciona el repo: **`fofostudio/fofostudio-dashboard`**

### Paso 3: Configuración del build
Netlify detectará automáticamente `netlify.toml`, pero verifica:

- **Base directory**: (dejar vacío)
- **Build command**: (dejar vacío)
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`

Click **"Deploy site"**

### Paso 4: Configura variables de entorno
Mientras hace el primer deploy, ve a:
**Site settings** → **Environment variables** → **Add a variable**

Agrega estas 2 variables:

| Key | Value | Descripción |
|-----|-------|-------------|
| `META_ACCESS_TOKEN` | `tu_token_aquí` | Token de acceso de Meta Graph API |
| `META_AD_ACCOUNT_ID` | `act_XXXXXXXXXX` | ID de tu cuenta de ads (ej: `act_123456789`) |

**¿Dónde conseguir estos valores?**

#### META_ACCESS_TOKEN
1. Ve a [Facebook Developers](https://developers.facebook.com/apps)
2. Selecciona tu app
3. Tools → Graph API Explorer
4. Genera un token con permisos:
   - `ads_read`
   - `ads_management`
   - `pages_read_engagement`

⚠️ **Importante**: Usa un token de **System User** o un token que no expire. Los tokens temporales expiran en 60 días.

#### META_AD_ACCOUNT_ID
1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Business settings → Ad accounts
3. Copia el ID (formato: `act_123456789`)

### Paso 5: Re-deploy
Una vez agregadas las variables:
1. Ve a **Deploys** en Netlify
2. Click en **"Trigger deploy"** → **"Deploy site"**

### Paso 6: ¡Listo! 🎉
Tu dashboard estará disponible en: `https://tu-sitio.netlify.app`

Netlify te asignará un nombre aleatorio. Puedes cambiarlo en:
**Site settings** → **Site details** → **Change site name**

Sugerencias:
- `fofostudio-marketing-dashboard`
- `fofostudio-ads-center`
- `fofostudio-command-center`

---

## Opción 2: Deploy con Netlify CLI

### Paso 1: Instala Netlify CLI
```bash
npm install -g netlify-cli
```

### Paso 2: Login
```bash
netlify login
```

### Paso 3: Clona el repo
```bash
git clone https://github.com/fofostudio/fofostudio-dashboard.git
cd fofostudio-dashboard
```

### Paso 4: Inicializa el sitio
```bash
netlify init
```

Sigue las instrucciones:
1. "What would you like to do?" → **Create & configure a new site**
2. "Team:" → Selecciona tu team
3. "Site name:" → `fofostudio-dashboard` (o el que prefieras)

### Paso 5: Configura variables de entorno
```bash
netlify env:set META_ACCESS_TOKEN "tu_token_aquí"
netlify env:set META_AD_ACCOUNT_ID "act_XXXXXXXXXX"
```

### Paso 6: Deploy
```bash
netlify deploy --prod
```

---

## 🔧 Desarrollo local con Netlify

Si quieres probar el dashboard localmente antes de deployar:

```bash
# Clona el repo
git clone https://github.com/fofostudio/fofostudio-dashboard.git
cd fofostudio-dashboard

# Configura variables de entorno locales
echo "META_ACCESS_TOKEN=tu_token" >> .env
echo "META_AD_ACCOUNT_ID=act_XXX" >> .env

# Inicia desarrollo local
netlify dev
```

Abre: `http://localhost:8888`

Las funciones estarán disponibles en: `http://localhost:8888/.netlify/functions/`

---

## 🔐 Seguridad: ¿Por qué variables de entorno?

❌ **NUNCA** hagas esto en el código:
```javascript
const META_TOKEN = "EAABsbCS..."; // ❌ MAL
```

✅ **SIEMPRE** usa variables de entorno:
```python
token = os.environ.get("META_ACCESS_TOKEN") # ✅ BIEN
```

**Ventajas**:
- No expones credenciales en GitHub
- Puedes tener diferentes tokens para dev/production
- Fácil de rotar tokens sin cambiar código

---

## 🐛 Troubleshooting

### Error: "Function returned undefined"
- Ve a Netlify → Functions → Logs
- Verifica que las variables de entorno estén configuradas
- Chequea que los nombres coincidan exactamente (`META_ACCESS_TOKEN`, no `meta_access_token`)

### Error: "Cannot find module 'requests'"
- Netlify instala automáticamente desde `requirements.txt`
- Si falla, verifica que `requirements.txt` esté en la raíz del repo

### Las métricas muestran 0
- Verifica que `META_AD_ACCOUNT_ID` sea correcto (debe empezar con `act_`)
- Chequea que el token tenga permisos de `ads_read`
- Prueba el token en [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

### El calendario no muestra posts
- Por ahora muestra datos de prueba (mock data)
- Para integrar con Google Sheets real, necesitas configurar más variables de entorno (próxima versión)

---

## 📊 Monitoreo

Una vez deployado, puedes ver:
- **Logs de las functions**: Netlify → Functions → Select function → Logs
- **Bandwidth usage**: Netlify → Analytics
- **Deploy history**: Netlify → Deploys

---

## 🔮 Próximos pasos

Una vez funcionando, puedes:
1. Configurar un dominio custom (ej: `dashboard.fofostudio.com`)
2. Habilitar notificaciones de deploy (email/Slack)
3. Configurar deploy previews para pull requests
4. Agregar analytics (Netlify Analytics o Google Analytics)

---

**Necesitas ayuda?** → Contacta a Jarvis en OpenClaw 🍁
