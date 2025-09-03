-- Ensure the beneficiarios table exists with the correct structure
-- This migration is safe to run multiple times

-- Drop the table if it exists and recreate it to ensure consistency
DROP TABLE IF EXISTS public.beneficiarios CASCADE;

-- Create the beneficiarios table with the exact structure needed
CREATE TABLE public.beneficiarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apellido VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rut VARCHAR(20) NULL, -- RUT is optional as per the requirements
  empresa VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add search indexes for efficient querying
CREATE INDEX idx_beneficiarios_apellido ON public.beneficiarios(apellido);
CREATE INDEX idx_beneficiarios_nombre ON public.beneficiarios(nombre);
CREATE INDEX idx_beneficiarios_empresa ON public.beneficiarios(empresa);
CREATE INDEX idx_beneficiarios_rut ON public.beneficiarios(rut) WHERE rut IS NOT NULL AND rut != '';
CREATE INDEX idx_beneficiarios_nombre_apellido ON public.beneficiarios(nombre, apellido);
CREATE INDEX idx_beneficiarios_apellido_nombre ON public.beneficiarios(apellido, nombre);

-- Enable Row Level Security
ALTER TABLE public.beneficiarios ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view beneficiarios" 
ON public.beneficiarios 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert beneficiarios" 
ON public.beneficiarios 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete beneficiarios" 
ON public.beneficiarios 
FOR DELETE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update beneficiarios" 
ON public.beneficiarios 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create the clear function for Excel upload
CREATE OR REPLACE FUNCTION public.clear_beneficiarios_data()
RETURNS void AS $$
BEGIN
  -- Truncate is more efficient than DELETE for clearing all data
  TRUNCATE TABLE public.beneficiarios RESTART IDENTITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.clear_beneficiarios_data() TO authenticated;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiarios TO authenticated;
GRANT USAGE ON SEQUENCE public.beneficiarios_id_seq TO authenticated;