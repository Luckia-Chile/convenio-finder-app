-- Función para limpiar todos los datos de beneficiarios antes de cargar nuevos
CREATE OR REPLACE FUNCTION public.clear_beneficiarios_data()
RETURNS void AS $$
BEGIN
  -- Truncate es más rápido que DELETE para limpiar toda la tabla
  TRUNCATE TABLE public.beneficiarios RESTART IDENTITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos a usuarios autenticados para ejecutar la función
GRANT EXECUTE ON FUNCTION public.clear_beneficiarios_data() TO authenticated;