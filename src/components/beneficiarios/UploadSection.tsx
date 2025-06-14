
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const UploadSection: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // TODO: Implementar la lógica de procesamiento de archivos Excel
    // Esto se implementará en una futura iteración
    
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFile(null);
    }, 2000);
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta funcionalidad estará disponible próximamente. Podrás subir archivos Excel con información de beneficiarios.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Seleccionar archivo Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={true} // Deshabilitado temporalmente
              />
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
              El archivo Excel debe contener las siguientes columnas:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">RUT</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">Nombre</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">Apellido</span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <span className="text-sm font-medium">Empresa</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
