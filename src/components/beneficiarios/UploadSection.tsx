import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, X, CloudUpload, CheckCircle, FileText, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

import { processExcelData, BATCH_SIZE } from '@/utils/excelDataProcessor';
import { UploadProgress } from './UploadProgress';
import { FileAnalysisPreview } from './FileAnalysisPreview';
import { UploadSummary } from './UploadSummary';

type UploadStage = 'select' | 'analysis' | 'processing' | 'summary';

interface UploadState {
  stage: UploadStage;
  selectedFile: File | null;
  analysisData: any;
  summaryData: any;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  estimatedTimeRemaining: number;
  startTime: number;
  cancelRequested: boolean;
}

export const UploadSection: React.FC = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    stage: 'select',
    selectedFile: null,
    analysisData: null,
    summaryData: null,
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
    processedRows: 0,
    totalRows: 0,
    estimatedTimeRemaining: 0,
    startTime: 0,
    cancelRequested: false,
  });

  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (warn if > 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: `El archivo es de ${(file.size / 1024 / 1024).toFixed(1)}MB. Archivos grandes pueden tardar más en procesarse.`,
      });
    }

    setUploadState(prev => ({ ...prev, selectedFile: file }));
    
    try {
      await analyzeFile(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al analizar el archivo. Verifica que sea un archivo Excel válido.",
      });
    }
  };

  const analyzeFile = async (file: File): Promise<void> => {
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

          // Convert array rows to objects for processing
          const objectData = dataRows.map((row: any) => ({
            APELLIDO: row[0],
            NOMBRE: row[1], 
            RUT: row[2],
            EMPRESA: row[3]
          }));

          // Process data for analysis - NO DUPLICATE REMOVAL
          const processed = processExcelData(objectData);

          // Calculate estimated processing time (rough estimate: 100ms per batch)
          const totalBatches = Math.ceil(processed.validRows.length / BATCH_SIZE);
          const estimatedTime = totalBatches * 0.5; // 0.5 seconds per batch

          const analysisData = {
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            totalRows: processed.totalRows,
            validRows: processed.validRows.length,
            skippedRows: processed.skippedRows,
            skippedReasons: processed.skippedReasons,
            previewRows: processed.validRows.slice(0, 5),
            estimatedProcessingTime: estimatedTime,
            processedData: processed.validRows
          };

          setUploadState(prev => ({
            ...prev,
            stage: 'analysis',
            analysisData
          }));

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsBinaryString(file);
    });
  };

  // Reemplazo atómico: una sola transacción en el servidor (replace_beneficiarios).
  // Si algo falla se conservan los datos anteriores, por eso no admite cancelación a medias.
  const processInBatches = async (data: any[]) => {
    const startTime = Date.now();

    setUploadState(prev => ({
      ...prev,
      stage: 'processing',
      totalBatches: 1,
      currentBatch: 1,
      totalRows: data.length,
      startTime,
      cancelRequested: false
    }));

    const { data: inserted, error } = await supabase.rpc('replace_beneficiarios', { rows: data });
    if (error) {
      throw new Error(`Error al reemplazar los beneficiarios (los datos anteriores se conservaron): ${error.message}`);
    }

    const processedRows = (inserted as number | null) ?? data.length;
    setUploadState(prev => ({ ...prev, progress: 100, processedRows, estimatedTimeRemaining: 0 }));
    return processedRows;
  };

  const handleConfirmUpload = async () => {
    if (!uploadState.analysisData?.processedData) return;

    try {
      const startTime = Date.now();
      const processedCount = await processInBatches(uploadState.analysisData.processedData);
      const processingTime = (Date.now() - startTime) / 1000;

      const summaryData = {
        success: true,
        totalRows: uploadState.analysisData.totalRows,
        validRows: uploadState.analysisData.validRows,
        processedRows: processedCount,
        skippedRows: uploadState.analysisData.skippedRows,
        duplicateRows: 0, // No duplicate detection anymore
        skippedReasons: uploadState.analysisData.skippedReasons,
        processingTime
      };

      setUploadState(prev => ({
        ...prev,
        stage: 'summary',
        summaryData
      }));

      toast({
        title: "Éxito",
        description: `Se cargaron ${processedCount.toLocaleString()} beneficiarios correctamente.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar el archivo';
      
      const summaryData = {
        success: false,
        totalRows: uploadState.analysisData?.totalRows || 0,
        validRows: 0,
        processedRows: uploadState.processedRows,
        skippedRows: 0,
        duplicateRows: 0,
        skippedReasons: [],
        processingTime: (Date.now() - uploadState.startTime) / 1000,
        errorMessage
      };

      setUploadState(prev => ({
        ...prev,
        stage: 'summary',
        summaryData
      }));

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    setUploadState(prev => ({ ...prev, cancelRequested: true }));
  };

  const resetUpload = () => {
    setUploadState({
      stage: 'select',
      selectedFile: null,
      analysisData: null,
      summaryData: null,
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedRows: 0,
      totalRows: 0,
      estimatedTimeRemaining: 0,
      startTime: 0,
      cancelRequested: false,
    });
  };

  const clearFile = () => {
    resetUpload();
  };

  return (
    <div className="space-y-6">
      {uploadState.stage === 'select' && (
        <div className="space-y-6">
          {/* Header con gradiente atractivo */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <CloudUpload className="h-8 w-8" />
                    Cargar Beneficiarios
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Sube archivos Excel para agregar beneficiarios al sistema
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zona de carga con diseño mejorado */}
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Selecciona tu archivo Excel
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Arrastra y suelta o haz clic para seleccionar
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="excel-file" className="sr-only">Seleccionar archivo Excel</Label>
                  <div className="relative">
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        type="button"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Seleccionar Archivo
                      </Button>
                      {uploadState.selectedFile && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={clearFile}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploadState.selectedFile && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">
                              {uploadState.selectedFile.name}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {(uploadState.selectedFile.size / 1024 / 1024).toFixed(2)} MB • Archivo Excel
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formatos soportados */}
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Soporta .xlsx y .xls • Máximo 50MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información importante con mejor diseño */}
          <div className="grid gap-4 md:grid-cols-2">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Sin detección de duplicados:</span> Esta versión insertará TODAS las filas válidas sin
                filtrar duplicados. Solo se omitirán filas completamente vacías o de encabezado.
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <span className="font-semibold">Procesamiento optimizado:</span> Los archivos grandes se procesan por lotes para mejor rendimiento.
                El RUT es opcional para beneficiarios que usan solo credenciales.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {uploadState.stage === 'analysis' && uploadState.analysisData && (
        <FileAnalysisPreview
          analysisData={uploadState.analysisData}
          onConfirm={handleConfirmUpload}
          onCancel={resetUpload}
          isProcessing={false}
        />
      )}

      {uploadState.stage === 'processing' && (
        <UploadProgress
          progress={uploadState.progress}
          currentBatch={uploadState.currentBatch}
          totalBatches={uploadState.totalBatches}
          processedRows={uploadState.processedRows}
          totalRows={uploadState.totalRows}
          estimatedTimeRemaining={uploadState.estimatedTimeRemaining}
          onCancel={handleCancel}
          canCancel={false}
        />
      )}

      {uploadState.stage === 'summary' && uploadState.summaryData && (
        <UploadSummary
          summaryData={uploadState.summaryData}
          onClose={resetUpload}
        />
      )}

      {/* Formato de archivo con diseño mejorado */}
      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <FileText className="h-5 w-5" />
            Formato de Archivo Esperado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-100 text-base leading-relaxed">
              El archivo Excel debe contener las siguientes columnas. El orden puede variar,
              el sistema detectará automáticamente las columnas:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative group">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-all duration-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Columna 1</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">APELLIDO</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Requerido</p>
                </div>
              </div>

              <div className="relative group">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Columna 2</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-bold text-green-900 dark:text-green-100">NOMBRE</span>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Requerido</p>
                </div>
              </div>

              <div className="relative group">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-700 transition-all duration-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Columna 3</span>
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-100">RUT</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Opcional</p>
                </div>
              </div>

              <div className="relative group">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 transition-all duration-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Columna 4</span>
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-bold text-purple-900 dark:text-purple-100">EMPRESA</span>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Requerido</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Columnas Detectadas Automáticamente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-100">Empresa/Institución:</span>
                  <p className="text-gray-600 dark:text-gray-400">EMPRESA, INSTITUCIÓN, ORGANIZACIÓN, ENTIDAD, EMPLEADOR, SERVICIO</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-100">Identificación:</span>
                  <p className="text-gray-600 dark:text-gray-400">RUT, RUN (formato flexible)</p>
                </div>
              </div>
            </div>

            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                <span className="font-semibold">Procesamiento inteligente:</span> El sistema maneja automáticamente
                instituciones especiales (COLEGIO MÉDICO, CARABINEROS, PDI, CAJA LA ARAUCANA),
                validación de datos y normalización de formatos.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
