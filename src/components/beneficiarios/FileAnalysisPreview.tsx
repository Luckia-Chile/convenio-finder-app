
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertTriangle, CheckCircle, Info, Eye, Upload } from 'lucide-react';

interface FileAnalysisData {
  fileName: string;
  fileSize: string;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  skippedReasons: string[];
  previewRows: any[];
  estimatedProcessingTime: number;
}

interface FileAnalysisPreviewProps {
  analysisData: FileAnalysisData;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const FileAnalysisPreview: React.FC<FileAnalysisPreviewProps> = ({
  analysisData,
  onConfirm,
  onCancel,
  isProcessing
}) => {
  const {
    fileName,
    fileSize,
    totalRows,
    validRows,
    skippedRows,
    skippedReasons,
    previewRows,
    estimatedProcessingTime
  } = analysisData;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Eye className="h-6 w-6" />
                Análisis Completado
              </h2>
              <p className="text-emerald-100">
                Revisa los datos antes de cargar al sistema
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-2 border-emerald-200 dark:border-emerald-700">
        <CardContent className="space-y-6 pt-6">
          {/* File Info mejorado */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Archivo:</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{fileName}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Tamaño:</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{fileSize}</p>
            </div>
          </div>

          {/* Processing Stats mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalRows.toLocaleString()}</div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Total de filas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{validRows.toLocaleString()}</div>
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">Filas válidas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{skippedRows.toLocaleString()}</div>
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-1">Filas omitidas</div>
            </div>
          </div>

          {/* Warnings and Info mejorados */}
          {skippedRows > 0 && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="space-y-2">
                  <p className="font-semibold">Se omitirán {skippedRows} filas:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {skippedReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <p className="font-medium">Tiempo estimado de procesamiento: <span className="font-bold">{formatTime(estimatedProcessingTime)}</span></p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Los datos se procesarán en lotes de 500 registros para optimizar el rendimiento.
              </p>
            </AlertDescription>
          </Alert>

          {/* Preview Table mejorado */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Vista previa (primeras 5 filas válidas)
            </h4>
            <div className="overflow-x-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">APELLIDO</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">NOMBRE</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">RUT</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">EMPRESA</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {previewRows.map((row, index) => (
                    <tr key={index} className={`${
                      index % 2 === 0
                        ? 'bg-gray-50 dark:bg-gray-700/50'
                        : 'bg-white dark:bg-gray-800'
                    } hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{row.apellido}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{row.nombre}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">{row.rut || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium">
                          {row.empresa}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons mejorados */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onConfirm}
              disabled={isProcessing || validRows === 0}
              size="lg"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="h-5 w-5 mr-2" />
              Cargar {validRows.toLocaleString()} registros válidos
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              disabled={isProcessing}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:border-gray-500"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
