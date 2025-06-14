import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

import { processExcelData, removeDuplicates, BATCH_SIZE } from '@/utils/excelDataProcessor';
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
      console.error('File analysis error:', error);
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

          // Process data for analysis
          const processed = processExcelData(objectData);
          const { uniqueData, duplicateCount } = removeDuplicates(processed.validRows);

          // Calculate estimated processing time (rough estimate: 100ms per batch)
          const totalBatches = Math.ceil(uniqueData.length / BATCH_SIZE);
          const estimatedTime = totalBatches * 0.5; // 0.5 seconds per batch

          const analysisData = {
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            totalRows: processed.totalRows,
            validRows: uniqueData.length,
            skippedRows: processed.skippedRows + duplicateCount,
            skippedReasons: [
              ...processed.skippedReasons,
              ...(duplicateCount > 0 ? [`${duplicateCount} filas duplicadas (mismo RUT)`] : [])
            ],
            previewRows: uniqueData.slice(0, 5),
            estimatedProcessingTime: estimatedTime,
            processedData: uniqueData
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

  const processInBatches = async (data: any[]) => {
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);
    const startTime = Date.now();

    setUploadState(prev => ({
      ...prev,
      stage: 'processing',
      totalBatches,
      totalRows: data.length,
      startTime,
      cancelRequested: false
    }));

    // Clear existing data first
    const { error: clearError } = await supabase.rpc('clear_beneficiarios_data');
    if (clearError) {
      throw new Error(`Error al limpiar datos existentes: ${clearError.message}`);
    }

    let processedRows = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      // Check for cancellation
      if (uploadState.cancelRequested) {
        throw new Error('Carga cancelada por el usuario');
      }

      const batch = data.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
      
      // Insert batch using upsert for better performance
      const { error: insertError } = await supabase
        .from('beneficiarios')
        .upsert(batch, { onConflict: 'rut' });

      if (insertError) {
        throw new Error(`Error al insertar lote ${currentBatch}: ${insertError.message}`);
      }

      processedRows += batch.length;
      const progress = (processedRows / data.length) * 100;
      
      // Calculate estimated time remaining
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedRows / elapsed;
      const remaining = data.length - processedRows;
      const estimatedTimeRemaining = remaining / rate;

      setUploadState(prev => ({
        ...prev,
        progress,
        currentBatch,
        processedRows,
        estimatedTimeRemaining: estimatedTimeRemaining || 0
      }));

      // Small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Force garbage collection hint (if available)
      if (global.gc) {
        global.gc();
      }
    }

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
        duplicateRows: uploadState.analysisData.skippedReasons
          .find((reason: string) => reason.includes('duplicadas'))
          ?.match(/\d+/)?.[0] || 0,
        skippedReasons: uploadState.analysisData.skippedReasons
          .filter((reason: string) => !reason.includes('duplicadas')),
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
      console.error('Upload error:', error);
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Subir Archivo Excel Optimizado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Seleccionar archivo Excel</Label>
              <div className="flex space-x-2">
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {uploadState.selectedFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {uploadState.selectedFile && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{uploadState.selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(uploadState.selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Optimizado para archivos grandes:</strong> Esta versión puede manejar archivos con 16,000+ filas 
                con procesamiento por lotes, validación automática y limpieza de datos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
          canCancel={!uploadState.cancelRequested}
        />
      )}

      {uploadState.stage === 'summary' && uploadState.summaryData && (
        <UploadSummary
          summaryData={uploadState.summaryData}
          onClose={resetUpload}
        />
      )}

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
                <strong>Funciones automáticas:</strong> Validación de datos, eliminación de duplicados, 
                manejo de instituciones especiales (COLEGIO MÉDICO, CARABINEROS, PDI), y omisión automática 
                de filas problemáticas con reporte detallado.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
