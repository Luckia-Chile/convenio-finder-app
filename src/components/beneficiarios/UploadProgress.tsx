
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  estimatedTimeRemaining: number;
  onCancel: () => void;
  canCancel: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  currentBatch,
  totalBatches,
  processedRows,
  totalRows,
  estimatedTimeRemaining,
  onCancel,
  canCancel
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-blue-900">Procesando archivo...</h3>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">
            Lote {currentBatch} de {totalBatches}
          </span>
          <span className="font-medium text-blue-900">
            {Math.round(progress)}%
          </span>
        </div>
        
        <Progress value={progress} className="w-full h-3" />
        
        <div className="flex items-center justify-between text-sm text-blue-600">
          <span>
            {processedRows.toLocaleString()} de {totalRows.toLocaleString()} registros
          </span>
          {estimatedTimeRemaining > 0 && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>~{formatTime(estimatedTimeRemaining)} restante</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
        ⚠️ Por favor, no cierres esta pestaña durante la carga
      </div>
    </div>
  );
};
