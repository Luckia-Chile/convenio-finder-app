-- Agregar campo role a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'consultor' CHECK (role IN ('admin', 'consultor'));

-- Crear índice para optimizar consultas por rol
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Actualizar la función handle_new_user para incluir rol por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'consultor'  -- Rol por defecto para nuevos usuarios
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar usuario de prueba existente como admin (CAMBIAR DESPUÉS)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'prueba@prueba.com';

-- Comentarios para documentación
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: admin (acceso completo) o consultor (solo búsquedas)';
COMMENT ON FUNCTION public.get_user_role() IS 'Obtiene el rol del usuario autenticado actual para verificar permisos';