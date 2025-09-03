# Fix Excel Upload - Beneficiarios Table Issue

## Problem
The Excel upload is failing with the error: `Error al limpiar datos existentes: relation "public.beneficiarios" does not exist`

## Solution
The `beneficiarios` table needs to be created in your Supabase database. Follow these steps:

### Step 1: Run the SQL Script in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the content of `fix_beneficiarios_table.sql` (created in this project root)
4. Click **Run** to execute the script

### Step 2: Verify Table Creation

After running the script, you should see:
- A message confirming the table was created successfully
- The table structure will be displayed showing all columns

### Step 3: Test Excel Upload

1. Go to your application
2. Navigate to **Búsqueda de Beneficiarios** → **Subir Archivos** tab
3. Upload the Excel file `Listado de trabajadores - Compilado.xlsx` (found in project root)
4. The upload should now work without errors

## Expected Table Structure

The `beneficiarios` table will have these columns:
- `id` (UUID, primary key, auto-generated)
- `apellido` (VARCHAR(100), required)
- `nombre` (VARCHAR(100), required)  
- `rut` (VARCHAR(20), optional - can be NULL/empty)
- `empresa` (VARCHAR(200), required)
- `created_at` (TIMESTAMP, auto-generated)

## Excel File Format Expected

The Excel file should have columns in this exact order:
1. **APELLIDO** (Required)
2. **NOMBRE** (Required)
3. **RUT** (Optional - can be empty for some beneficiaries)
4. **EMPRESA** (Required)

## Important Notes

- **RUT is optional**: Some beneficiaries may not have RUT (using credentials only)
- **No duplicate detection**: All valid rows will be inserted as-is
- **Data clearing**: The system will clear ALL existing beneficiarios before loading new data
- **Validation**: Only completely empty rows or header rows will be skipped

## Features of the Upload System

✅ **Batch Processing**: Large files are processed in batches of 500 records  
✅ **Progress Tracking**: Real-time progress with estimated time remaining  
✅ **Error Handling**: Detailed error messages and recovery options  
✅ **File Analysis**: Preview of data before actual upload  
✅ **Institution Detection**: Automatic handling of special institutions (COLEGIO MÉDICO, CARABINEROS, PDI)  

## Security & Permissions

The table includes:
- Row Level Security (RLS) enabled
- Policies for authenticated users to SELECT, INSERT, UPDATE, DELETE
- Secure function for clearing data before uploads
- Proper indexes for efficient searching

## After the Fix

Once the table is created, the Excel upload will:
1. ✅ Analyze the file and show preview
2. ✅ Clear existing data (as intended)
3. ✅ Upload new data in batches
4. ✅ Show upload summary with statistics
5. ✅ Allow searching the newly uploaded beneficiarios

The error should be resolved and Excel upload should work perfectly!