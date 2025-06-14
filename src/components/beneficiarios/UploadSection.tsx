
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ExcelData {
  apellido: string;
  nombre: string;
  rut: string;
  empresa: string;
}

export const UploadSection: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResults(null);
    }
  };

  const validateExcelData = (data: any[]): ExcelData[] => {
    const validatedData: ExcelData[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check if row has the required columns in correct order
      const keys = Object.keys(row);
      if (keys.length < 4) {
        throw new Error(`Fila ${i + 2}: Faltan columnas. Se esperan 4 columnas: APELLIDO, NOMBRE, RUT, EMPRESA`);
      }

      // Get values by position (assuming first 4 columns)
      const values = Object.values(row) as string[];
      const apellido = values[0]?.toString().trim();
      const nombre = values[1]?.toString().trim();
      const rut = values[2]?.toString().trim();
      const empresa = values[3]?.toString().trim();

      // Validate required fields
      if (!apellido || !nombre || !rut || !empresa) {
        throw new Error(`Fila ${i + 2}: Todos los campos son obligatorios (APELLIDO, NOMBRE, RUT, EMPRESA)`);
      }

      validatedData.push({
        apellido,
        nombre,
        rut,
        empresa
      });
    }

    return validatedData;
  };

  const processExcelFile = async (file: File): Promise<ExcelData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Remove header row and empty rows
          const dataRows = jsonData.slice(1).filter((row: any) => 
            row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
          );

          if (dataRows.length === 0) {
            throw new Error('El archivo Excel está vacío o no contiene datos válidos');
          }

          // Convert array rows to objects for validation
          const objectData = dataRows.map((row: any) => ({
            col1: row[0],
            col2: row[1], 
            col3: row[2],
            col4: row[3]
          }));

          const validatedData = validateExcelData(objectData);
          resolve(validatedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      // Step 1: Process Excel file
      setUploadProgress(20);
      const excelData = await processExcelFile(selectedFile);
      
      // Step 2: Clear existing data
      setUploadProgress(40);
      const { error: clearError } = await supabase.rpc('clear_beneficiarios_data');
      
      if (clearError) {
        throw new Error(`Error al limpiar datos existentes: ${clearError.message}`);
      }

      // Step 3: Insert new data in batches
      setUploadProgress(60);
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('beneficiarios')
          .insert(batch);

        if (insertError) {
          throw new Error(`Error al insertar datos: ${insertError.message}`);
        }

        insertedCount += batch.length;
        setUploadProgress(60 + (insertedCount / excelData.length) * 35);
      }

      setUploadProgress(100);
      setUploadResults({
        success: true,
        message: `Archivo procesado exitosamente. Se insertaron ${insertedCount} beneficiarios.`,
        count: insertedCount
      });

      toast({
        title: "Éxito",
        description: `Se cargaron ${insertedCount} beneficiarios correctamente.`,
      });

      // Clear file selection
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar el archivo';
      
      setUploadResults({
        success: false,
        message: errorMessage
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResults(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Subir Archivo Excel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Seleccionar archivo Excel</Label>
              <div className="flex space-x-2">
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="flex-1"
                />
                {selectedFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Procesando archivo...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {uploadResults && (
              <Alert className={uploadResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {uploadResults.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={uploadResults.success ? "text-green-800" : "text-red-800"}>
                  {uploadResults.message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando archivo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir y Procesar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Archivo Esperado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600">
              El archivo Excel debe contener las siguientes columnas en este orden exacto:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">1. APELLIDO</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">2. NOMBRE</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">3. RUT</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">4. EMPRESA</span>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Al subir un nuevo archivo, se reemplazarán todos los datos existentes en la base de datos.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
