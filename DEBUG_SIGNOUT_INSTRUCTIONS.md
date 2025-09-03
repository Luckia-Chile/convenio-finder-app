# 🚪 Debugging SignOut - Instrucciones de Prueba

## 🔍 **Paso a Paso para Probar**

### 1. **Abrir DevTools**
- Presiona `F12` o `Ctrl+Shift+I` 
- Ve a la pestaña **Console**
- Limpia la consola (`Ctrl+L`)

### 2. **Iniciar Sesión**
- Ve a `/auth`
- Inicia sesión normalmente
- Deberías ver logs como: `🔔 Auth state changed: SIGNED_IN`

### 3. **Ir a Página Protegida**
- Navega a `/` o `/beneficiarios`
- Confirma que ves el Header con tu email
- Deberías ver logs como: `🛡️ ProtectedRoute - User state changed: [User Object]`

### 4. **Intentar Cerrar Sesión**
- Click en botón "Salir" (desktop o mobile)
- **OBSERVA LA CONSOLA** - deberías ver:

```
🎯 handleSignOut called
🎯 signOut function exists: true
🎯 current user: [User Object]
🎯 Calling signOut...
🚪 Starting signOut process...
🚪 Current user: [User Object]
🚪 Current session: [Session Object]
✅ SignOut completed successfully
🔄 Manually clearing user state...
🗑️ Cleared localStorage key: [keys]
🎯 signOut call completed
🔔 Auth state changed: SIGNED_OUT null
🛡️ ProtectedRoute - User state changed: null
🚪 ProtectedRoute - No user found, redirecting to /auth
```

## ❌ **Si NO Funciona**

### **Problema 1: No aparecen logs en consola**
- El botón no está ejecutando `handleSignOut`
- Verifica que no hay errores de JavaScript
- Recarga la página completamente

### **Problema 2: Aparecen logs pero no redirige**
- Verifica si aparece: `🔔 Auth state changed: SIGNED_OUT`
- Si NO aparece, hay problema con Supabase
- Si SÍ aparece pero no redirige, hay problema con ProtectedRoute

### **Problema 3: Error en signOut**
- Verifica el mensaje de error específico
- Puede ser problema de conectividad con Supabase

## 🛠️ **Diagnósticos Adicionales**

### **Verificar LocalStorage**
En DevTools → Application → Local Storage:
- Antes del logout: Deberías ver claves con `sb-` o `supabase`
- Después del logout: Estas claves deberían estar eliminadas

### **Verificar Network**
En DevTools → Network:
- Durante logout busca requests a `supabase.co`
- Deberían aparecer requests de `auth/v1/logout`

### **Forzar Logout Manual**
Si el botón no funciona, prueba en la consola:
```javascript
// Verificar estado actual
console.log('User:', window.supabase.auth.getUser());

// Forzar logout
window.supabase.auth.signOut();

// Verificar después
setTimeout(() => console.log('After logout:', window.supabase.auth.getUser()), 1000);
```

## 📋 **Reportar Problema**

Si sigue sin funcionar, comparte:
1. **Logs completos de la consola**
2. **Errores específicos** (si los hay)
3. **En qué paso se detiene** el proceso
4. **Estado del localStorage** antes y después

---

## 🎯 **Resultado Esperado**

✅ Click "Salir" → Spinner → Logs en consola → Redirección automática a `/auth`

¡Prueba estos pasos y cuéntame qué ves en la consola!