
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, FileSpreadsheet, Clock } from 'lucide-react';

interface UploadSummaryData {
  success: boolean;
  totalRows: number;
  validRows: number;
  processedRows: number;
  skippedRows: number;
  duplicateRows: number; // Keep for compatibility but will always be 0
  skippedReasons: string[];
  processingTime: number;
  errorMessage?: string;
}

interface UploadSummaryProps {
  summaryData: UploadSummaryData;
  onClose: () => void;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({
  summaryData,
  onClose
}) => {
  const {
    success,
    totalRows,
    validRows,
    processedRows,
    skippedRows,
    skippedReasons,
    processingTime,
    errorMessage
  } = summaryData;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span>
            {success ? 'Carga Completada' : 'Error en la Carga'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <>
            {/* Success Stats - Removed duplicate column */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{totalRows.toLocaleString()}</div>
                <div className="text-xs text-gray-800 dark:text-gray-200">Total de filas</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{processedRows.toLocaleString()}</div>
                <div className="text-xs text-gray-800 dark:text-gray-200">Registros cargados</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{skippedRows.toLocaleString()}</div>
                <div className="text-xs text-gray-800 dark:text-gray-200">Filas omitidas</div>
              </div>
            </div>

            {/* Processing Time */}
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-800 dark:text-gray-200" />
              <span className="text-sm text-gray-700">
                Tiempo de procesamiento: <strong>{formatTime(processingTime)}</strong>
              </span>
            </div>

            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-medium">
                  ✅ Se cargaron exitosamente {processedRows.toLocaleString()} beneficiarios
                </p>
                {skippedRows > 0 && (
                  <p className="text-sm mt-1">
                    Se omitieron {skippedRows.toLocaleString()} filas solo por problemas de validación (filas vacías o encabezados).
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {/* Skipped Reasons */}
            {skippedReasons.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Detalles de filas omitidas:</p>
                    <ul className="list-disc list-inside text-sm">
                      {skippedReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          /* Error Message */
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-medium">Error durante la carga:</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Close Button */}
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Cargar Otro Archivo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
