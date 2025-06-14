
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <span>Análisis del Archivo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-600">Archivo:</span>
            <p className="text-sm">{fileName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Tamaño:</span>
            <p className="text-sm">{fileSize}</p>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{totalRows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total de filas</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{validRows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Filas válidas</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{skippedRows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Filas omitidas</div>
          </div>
        </div>

        {/* Warnings and Info */}
        {skippedRows > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Se omitirán {skippedRows} filas:</p>
                <ul className="list-disc list-inside text-sm">
                  {skippedReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p>Tiempo estimado de procesamiento: <strong>{formatTime(estimatedProcessingTime)}</strong></p>
            <p className="text-sm text-gray-600 mt-1">
              Los datos se procesarán en lotes de 500 registros para optimizar el rendimiento.
            </p>
          </AlertDescription>
        </Alert>

        {/* Preview Table */}
        <div>
          <h4 className="font-medium mb-2">Vista previa (primeras 5 filas válidas):</h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">APELLIDO</th>
                  <th className="px-3 py-2 text-left font-medium">NOMBRE</th>
                  <th className="px-3 py-2 text-left font-medium">RUT</th>
                  <th className="px-3 py-2 text-left font-medium">EMPRESA</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">{row.apellido}</td>
                    <td className="px-3 py-2">{row.nombre}</td>
                    <td className="px-3 py-2">{row.rut}</td>
                    <td className="px-3 py-2">{row.empresa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            onClick={onConfirm}
            disabled={isProcessing || validRows === 0}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Cargar {validRows.toLocaleString()} registros válidos
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
