
-- Allow RUT to be NULL/empty since some beneficiaries use credentials only
ALTER TABLE public.beneficiarios 
ALTER COLUMN rut DROP NOT NULL;

-- Update the index to handle NULL RUT values
DROP INDEX IF EXISTS idx_beneficiarios_rut;
CREATE INDEX idx_beneficiarios_rut ON public.beneficiarios(rut) WHERE rut IS NOT NULL AND rut != '';
