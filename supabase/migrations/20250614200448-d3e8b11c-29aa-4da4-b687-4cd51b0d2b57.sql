
-- Create the beneficiarios table with the exact structure specified
CREATE TABLE public.beneficiarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rut VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  empresa VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add search indexes for efficient querying
CREATE INDEX idx_beneficiarios_rut ON public.beneficiarios(rut);
CREATE INDEX idx_beneficiarios_nombre ON public.beneficiarios(nombre);
CREATE INDEX idx_beneficiarios_apellido ON public.beneficiarios(apellido);

-- Enable Row Level Security
ALTER TABLE public.beneficiarios ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read beneficiarios
CREATE POLICY "Users can view beneficiarios" 
ON public.beneficiarios 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert beneficiarios
CREATE POLICY "Users can insert beneficiarios" 
ON public.beneficiarios 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete beneficiarios
CREATE POLICY "Users can delete beneficiarios" 
ON public.beneficiarios 
FOR DELETE 
USING (auth.role() = 'authenticated');
