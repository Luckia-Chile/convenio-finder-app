
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';

interface Beneficiario {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  empresa: string;
  created_at: string;
}

interface BeneficiariosListProps {
  beneficiarios: Beneficiario[];
  isLoading: boolean;
}

export const BeneficiariosList: React.FC<BeneficiariosListProps> = ({ 
  beneficiarios, 
  isLoading 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Buscando beneficiarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Resultados de Búsqueda</span>
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {beneficiarios.length} beneficiarios encontrados
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {beneficiarios.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No se encontraron beneficiarios</p>
            <p className="text-gray-400">
              Intenta con diferentes términos de búsqueda o sube un archivo Excel con nuevos datos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiarios.map((beneficiario, index) => (
                  <TableRow key={beneficiario.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {beneficiario.rut}
                    </TableCell>
                    <TableCell>
                      {beneficiario.apellido}
                    </TableCell>
                    <TableCell>
                      {beneficiario.nombre}
                    </TableCell>
                    <TableCell>
                      {beneficiario.empresa}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
