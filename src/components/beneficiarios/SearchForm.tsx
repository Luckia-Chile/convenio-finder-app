
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchFormProps {
  onSearch: (results: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, setIsLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('general');
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim() && searchType !== 'general') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un término de búsqueda.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let query = supabase.from('beneficiarios').select('*');

      if (searchTerm.trim()) {
        switch (searchType) {
          case 'rut':
            query = query.ilike('rut', `%${searchTerm}%`);
            break;
          case 'nombre':
            query = query.or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%`);
            break;
          case 'empresa':
            query = query.ilike('empresa', `%${searchTerm}%`);
            break;
          default:
            query = query.or(`rut.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

      if (error) {
        console.error('Error searching beneficiarios:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al buscar beneficiarios. Por favor intenta nuevamente.",
        });
        return;
      }

      onSearch(data || []);
      
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${data?.length || 0} beneficiarios.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al realizar la búsqueda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchType('general');
    onSearch([]);
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="searchType">Tipo de búsqueda</Label>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Búsqueda General</SelectItem>
              <SelectItem value="rut">RUT del Beneficiario</SelectItem>
              <SelectItem value="nombre">Nombre del Beneficiario</SelectItem>
              <SelectItem value="empresa">Nombre de Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="searchTerm">Término de búsqueda</Label>
          <Input
            id="searchTerm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ingresa el término a buscar..."
            className="w-full"
          />
        </div>

        <div className="space-y-2 flex items-end">
          <div className="flex space-x-2 w-full">
            <Button type="submit" className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
