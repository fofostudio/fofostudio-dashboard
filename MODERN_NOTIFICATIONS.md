# 🎨 Sistema de Notificaciones Modernas

## 🚫 Adiós Alertas Nativas

Todas las alertas nativas de navegador han sido reemplazadas con modales modernos que coinciden con el diseño del dashboard.

### Antes ❌
```javascript
alert("Error al guardar");  // Feo, fuera del estilo
confirm("¿Eliminar?");      // Inconsistente
```

### Ahora ✅
```javascript
showAlert("Error al guardar");        // Moderno, con estilo
showConfirm("¿Eliminar?");            // Promise-based
showToast("Guardado!", "success");    // No bloqueante
```

---

## 📚 API Completa

### 1. **showAlert(message, type)**

Modal bloqueante con un solo botón.

```javascript
// Info (default)
showAlert("Información importante");

// Success
showAlert("¡Operación exitosa!", "success");

// Error
showAlert("Algo salió mal", "error");

// Warning
showAlert("Ten cuidado", "warning");
```

**Características:**
- ✅ Overlay con blur
- ✅ Ícono según tipo (ℹ️ ✅ ❌ ⚠️)
- ✅ Botón "Entendido"
- ✅ Click en overlay para cerrar
- ✅ Animación suave

---

### 2. **showConfirm(message, options)**

Modal de confirmación con dos botones, retorna Promise.

```javascript
// Básico
const confirmed = await showConfirm("¿Eliminar este item?");
if (confirmed) {
    // Usuario confirmó
}

// Con opciones personalizadas
const result = await showConfirm("¿Mover publicación?", {
    confirmText: "Mover",
    cancelText: "No, gracias",
    icon: "🚀",
    type: "question"
});
```

**Options:**
```javascript
{
    confirmText: "Aceptar",    // Texto del botón OK
    cancelText: "Cancelar",    // Texto del botón Cancel
    icon: "❓",                 // Emoji personalizado
    type: "question"           // Tipo de modal
}
```

**Características:**
- ✅ Retorna `true` si confirma, `false` si cancela
- ✅ ESC key = cancelar
- ✅ Overlay click = cancelar
- ✅ Promise-based (usa con async/await)

---

### 3. **showToast(message, type, duration)**

Notificación no bloqueante que aparece y desaparece.

```javascript
// Success (verde)
showToast("Post publicado!", "success");

// Error (rojo)
showToast("Error al cargar", "error");

// Warning (amarillo)
showToast("Revisa este dato", "warning");

// Info (azul, default)
showToast("Nueva actualización disponible", "info");

// Con duración personalizada (default: 3000ms)
showToast("Mensaje largo", "info", 5000);
```

**Características:**
- ✅ Aparece arriba a la derecha
- ✅ Se auto-cierra después de `duration`
- ✅ Click para cerrar manualmente
- ✅ Animación slide-in desde la derecha
- ✅ Borde de color según tipo

---

### 4. **showLoading(message)**

Overlay de carga con spinner.

```javascript
const loadingId = showLoading("Generando imagen...");

// Hacer operación async
await generateImage();

// Cerrar loading
hideLoading(loadingId);
```

**Características:**
- ✅ Spinner animado
- ✅ Mensaje personalizable
- ✅ Overlay con blur fuerte
- ✅ Retorna ID único para cerrar
- ✅ Bloquea interacción mientras carga

---

### 5. **showPrompt(message, defaultValue, options)**

Modal con input de texto.

```javascript
// Básico
const name = await showPrompt("¿Cómo te llamas?");
if (name) {
    console.log("Hola " + name);
}

// Con valor por defecto
const newName = await showPrompt("Nuevo nombre:", "Post 123");

// Con opciones
const title = await showPrompt("Título del post:", "", {
    placeholder: "Ej: Tips de diseño",
    confirmText: "Crear",
    cancelText: "Cancelar"
});
```

**Options:**
```javascript
{
    placeholder: "",           // Placeholder del input
    confirmText: "Aceptar",   // Texto botón OK
    cancelText: "Cancelar"    // Texto botón Cancel
}
```

**Características:**
- ✅ Retorna texto ingresado o `null` si cancela
- ✅ ENTER = confirmar
- ✅ ESC = cancelar
- ✅ Input auto-focus y selección

---

## 🎨 Diseño

### Estilos
- **Overlay:** rgba(0,0,0,0.7) con backdrop-blur
- **Modal:** Glassmorphism matching dashboard
- **Animaciones:** Scale-in (0.9 → 1.0)
- **Colores:** Variables CSS del dashboard

### Toast Colors
```css
Success → border-left: 4px solid #22c55e
Error   → border-left: 4px solid #ef4444
Warning → border-left: 4px solid #f59e0b
Info    → border-left: 4px solid #3b82f6
```

---

## 🔄 Override Nativos

El sistema **reemplaza automáticamente** las funciones nativas:

```javascript
// Esto ahora usa el modal moderno
alert("Hola");      // → showAlert("Hola")
confirm("¿OK?");    // → showConfirm("¿OK?")
```

**Ventaja:** Código legacy funciona automáticamente con el nuevo diseño.

---

## 📱 Responsive

### Desktop
- Modal width: 400-600px
- Toast: top-right fixed

### Mobile
- Modal width: 90%
- Toast: full width (left + right 1rem)
- Padding reducido

---

## ⌨️ Teclado

**Modales:**
- `ESC` → Cerrar/Cancelar
- `ENTER` → Confirmar (en prompts)

**Toast:**
- `Click` → Cerrar inmediatamente

---

## 🎯 Casos de Uso

### 1. Errores
```javascript
try {
    await doSomething();
} catch (error) {
    showAlert("Error: " + error.message, "error");
}
```

### 2. Confirmaciones
```javascript
const sure = await showConfirm("¿Eliminar 50 items?");
if (sure) {
    await deleteItems();
    showToast("Items eliminados", "success");
}
```

### 3. Loading States
```javascript
const id = showLoading("Procesando...");
await heavyOperation();
hideLoading(id);
showToast("Completado!", "success");
```

### 4. Input Usuario
```javascript
const name = await showPrompt("Nombre del proyecto:");
if (name) {
    createProject(name);
}
```

---

## 🔮 Mejoras Futuras

- [ ] Notificaciones apilables (múltiples toasts)
- [ ] Botones personalizados en alerts
- [ ] Modales con contenido HTML custom
- [ ] Sound effects opcionales
- [ ] Persistencia de notificaciones
- [ ] Action buttons en toasts
- [ ] Progress bar en loading

---

**Fecha:** 2026-02-25  
**Commit:** `a93ddf5`  
**Archivo:** `public/notifications.js`
