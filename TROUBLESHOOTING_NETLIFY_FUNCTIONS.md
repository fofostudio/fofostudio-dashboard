# 🔧 Troubleshooting Netlify Functions

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

Este error ocurre cuando Netlify devuelve HTML (página de error) en lugar de JSON.

### Causas Comunes:

1. **Function no encontrada (404)**
   - La función no existe en `netlify/functions/`
   - El nombre del archivo no coincide con la URL
   - Netlify no detectó la función en el deploy

2. **Redirect interfiriendo con functions**
   - El `netlify.toml` tiene un redirect que captura las functions
   - ✅ Solucionado: Agregamos un redirect específico para functions

3. **Runtime de Python no configurado**
   - Falta `runtime.txt` con la versión de Python
   - Falta `requirements.txt` con las dependencias

4. **Variables de entorno no configuradas**
   - La función necesita variables que no están en Netlify
   - Devuelve error 500 que se muestra como HTML

### Cómo Diagnosticar:

#### 1. Verifica que la función existe
```bash
ls netlify/functions/google-auth-url.py
# Debe existir
```

#### 2. Verifica el nombre de la función en la URL
En el navegador, la URL debe ser:
```
https://tu-sitio.netlify.app/.netlify/functions/google-auth-url
```
(Sin `.py` al final)

#### 3. Revisa los logs de Netlify
1. Ve a Netlify Dashboard
2. Functions → Selecciona la función
3. Logs → Busca errores

#### 4. Verifica las variables de entorno
Para `google-auth-url` necesitas:
```
GOOGLE_CLIENT_ID
GOOGLE_REDIRECT_URI
```

#### 5. Abre la consola del navegador (F12)
Busca:
- Request URL (debe apuntar a `/.netlify/functions/...`)
- Response status (200, 404, 500, etc.)
- Response body (JSON o HTML)

### Solución:

#### Si es un 404 (función no encontrada):

1. **Verifica el deploy**:
   - Ve a Netlify → Deploys → Last deploy
   - Click en "Deploy log"
   - Busca: "Functions bundled" o "Functions detected"
   - Debe listar tus funciones Python

2. **Re-deploy**:
   ```bash
   # Desde Netlify Dashboard
   Deploys → Trigger deploy → Deploy site
   ```

3. **Verifica el formato del archivo**:
   - Debe tener `handler(event, context)` como función principal
   - Debe devolver `{"statusCode": 200, "headers": {...}, "body": "..."}`

#### Si es un 500 (error interno):

1. **Revisa los logs de la función**:
   - Netlify → Functions → google-auth-url → Logs
   - Busca el error Python

2. **Verifica las dependencias**:
   - `requirements.txt` debe tener todas las librerías
   - Netlify las instala automáticamente

3. **Verifica las variables de entorno**:
   - Netlify → Site settings → Environment variables
   - Deben estar configuradas TODAS las requeridas

#### Si las functions no se detectan:

1. **Verifica `netlify.toml`**:
   ```toml
   [build]
     functions = "netlify/functions"
   
   [functions]
     directory = "netlify/functions"
   ```

2. **Verifica `runtime.txt`**:
   ```
   3.9
   ```

3. **Re-deploy limpio**:
   - Netlify → Deploys → Clear cache and deploy site

### Testing Local:

Para probar las functions localmente (antes de deployar):

```bash
# Instala Netlify CLI
npm install -g netlify-cli

# Inicia dev server
netlify dev

# Abre: http://localhost:8888
# Functions en: http://localhost:8888/.netlify/functions/google-auth-url
```

### Logs Útiles en la Consola:

En `auth.js` agregamos logs para debug:
```javascript
console.log('Requesting OAuth URL from:', url);
console.log('Response status:', response.status);
console.log('Response headers:', response.headers.get('content-type'));
```

Abre la consola (F12) y verás exactamente qué está pasando.

---

## Checklist de Deploy

Antes de reportar un error, verifica:

- [ ] Función existe en `netlify/functions/nombre.py`
- [ ] `netlify.toml` tiene `functions = "netlify/functions"`
- [ ] `runtime.txt` tiene `3.9` (o tu versión de Python)
- [ ] `requirements.txt` tiene todas las dependencias
- [ ] Variables de entorno configuradas en Netlify
- [ ] Deploy completado sin errores
- [ ] Functions aparecen en Netlify Dashboard → Functions
- [ ] URL correcta: `/.netlify/functions/nombre` (sin `.py`)

---

## Ejemplo de Función Correcta

```python
"""Mi función de Netlify"""
import json

def handler(event, context):
    """Handler principal (obligatorio)"""
    
    # CORS headers
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }
    
    # Handle preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Tu lógica aquí
        result = {"message": "Success"}
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(result)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
```

**Estructura obligatoria**:
- ✅ Función llamada `handler`
- ✅ Parámetros `(event, context)`
- ✅ Retorna dict con `statusCode`, `headers`, `body`
- ✅ `body` es string (usa `json.dumps()` para JSON)
- ✅ Maneja CORS con headers

---

**¿Más problemas?** → Revisa los logs de Netlify Functions o contacta al equipo.
