
-- First, let's check if we need to modify the table structure
-- The current table already has the right columns, but let's ensure the order matches expectations
-- We'll also add an index for better performance on the new search patterns

-- Add additional indexes for the new search patterns
CREATE INDEX IF NOT EXISTS idx_beneficiarios_nombre_apellido ON public.beneficiarios(nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_beneficiarios_apellido_nombre ON public.beneficiarios(apellido, nombre);

-- Add a function to clear all beneficiarios data (for Excel upload replacement)
CREATE OR REPLACE FUNCTION clear_beneficiarios_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.beneficiarios;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clear_beneficiarios_data() TO authenticated;
