# 🔐 CONFIGURACIÓN SEGURA DEL ENTORNO

## 🚀 **Configuración Inicial**

### **1. Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar con tus credenciales reales
nano .env.local
```

### **2. Configurar Credenciales de Supabase**
1. Ve a tu **Supabase Dashboard**
2. Copia las credenciales de **Settings → API**
3. Pega en `.env.local`:
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### **3. Aplicar Migraciones de Seguridad**
```bash
# Si tienes Supabase CLI configurado
supabase db push

# O ejecuta manualmente en Supabase SQL Editor:
# - supabase/migrations/20250903120000_enhanced_security_policies.sql
```

---

## ⚠️ **VERIFICACIONES DE SEGURIDAD**

### **✅ Variables de Entorno Configuradas**
- [ ] `.env.local` creado y configurado
- [ ] Credenciales de Supabase actualizadas
- [ ] `.env.local` agregado a `.gitignore`

### **✅ Base de Datos Segura**
- [ ] Políticas RLS habilitadas
- [ ] Función `is_admin()` creada
- [ ] Tabla de auditoría `security_audit_logs` creada
- [ ] Políticas restrictivas aplicadas

### **✅ Logging Seguro**
- [ ] Logs sanitizados en producción
- [ ] No se exponen datos sensibles
- [ ] Solo información necesaria en consola

---

## 🧪 **PRUEBAS DE FUNCIONAMIENTO**

### **1. Verificar Conexión**
```bash
npm run dev
# Abrir http://localhost:8080
# Verificar que no hay errores en consola
```

### **2. Probar Autenticación**
- [ ] Login/logout funciona
- [ ] Roles se detectan correctamente
- [ ] ProtectedRoute redirige sin usuario

### **3. Probar Carga de Archivos** 
- [ ] Solo admins pueden subir Excel
- [ ] Consultores solo pueden buscar
- [ ] Validación de archivos funciona

### **4. Verificar Logs**
- [ ] En desarrollo: logs detallados
- [ ] En producción: logs sanitizados
- [ ] No se exponen emails/RUTs/IDs

---

## 🚨 **PROBLEMAS COMUNES**

### **Error: "Missing Supabase environment variables"**
```bash
# Solución: Verificar .env.local
cat .env.local
# Debe contener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

### **Error: "Access denied. Admin privileges required"**
```sql
-- Solución: Asignar rol admin en Supabase
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';
```

### **Logs no aparecen en desarrollo**
```bash
# Verificar variable de entorno
echo $VITE_LOG_LEVEL
# Debe ser "debug" para ver todos los logs
```

---

## 🔒 **MEJORES PRÁCTICAS**

### **Nunca commits estos archivos:**
- `.env.local` (credenciales reales)
- `DEBUG_*.md` (información sensible)
- `SECURITY_*.md` (reportes de seguridad)

### **Para producción:**
- Usar variables de entorno del hosting
- Habilitar HTTPS sempre
- Configurar Rate Limiting
- Monitorear logs de auditoría

### **Mantenimiento:**
- Rotar credenciales cada 3-6 meses
- Revisar logs de auditoría mensualmente
- Actualizar dependencias regularmente

---

## 📞 **SOPORTE**

Si encuentras problemas:
1. Revisa la consola del navegador
2. Verifica `.env.local`
3. Confirma que las migraciones se ejecutaron
4. Revisa la tabla `security_audit_logs` en Supabase

¡Tu sistema ahora tiene seguridad de nivel empresarial! 🛡️