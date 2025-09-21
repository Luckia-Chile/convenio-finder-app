import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllInstitutions, InstitutionInfo } from '@/utils/institutionDetector';
import InstitutionFileService from '@/services/institutionFileService';

interface EditableInstitution extends InstitutionInfo {
  isEditing?: boolean;
  isNew?: boolean;
}

const AVAILABLE_ICONS = [
  '👮‍♂️', '🕵️‍♂️', '⚕️', '🏛️', '🏢', '🎓', '⚖️', '🚑', '🔧', '📋',
  '🛡️', '💼', '🏥', '🏦', '🏭', '🎯', '⭐', '🔥', '💎', '🎨'
];

const PRESET_COLORS = [
  { name: 'Verde', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  { name: 'Azul', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  { name: 'Rojo', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  { name: 'Púrpura', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  { name: 'Naranja', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  { name: 'Amarillo', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  { name: 'Índigo', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  { name: 'Rosa', bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' }
];

export default function InstitutionManager() {
  const [institutions, setInstitutions] = useState<EditableInstitution[]>([]);
  const [previewInstitution, setPreviewInstitution] = useState<EditableInstitution | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = () => {
    try {
      const currentInstitutions = getAllInstitutions();
      setInstitutions(currentInstitutions.map(inst => ({ ...inst, isEditing: false })));
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las instituciones.",
      });
    }
  };

  const startEditing = (id: string) => {
    setInstitutions(prev => prev.map(inst =>
      inst.id === id ? { ...inst, isEditing: true } : { ...inst, isEditing: false }
    ));
  };

  const cancelEditing = (id: string) => {
    setInstitutions(prev => prev.map(inst =>
      inst.id === id ? { ...inst, isEditing: false } : inst
    ).filter(inst => !inst.isNew));
  };

  const addNewInstitution = () => {
    // Verificar que no hay otra institución en modo edición
    const hasEditingInstitution = institutions.some(inst => inst.isEditing);
    if (hasEditingInstitution) {
      toast({
        variant: "destructive",
        title: "Finaliza la edición actual",
        description: "Guarda o cancela la institución que estás editando antes de crear una nueva.",
      });
      return;
    }

    const newInstitution: EditableInstitution = {
      id: `temp-${Date.now()}`,
      name: '',
      displayName: '',
      credentialMessage: '',
      keywords: [],
      variants: [],
      color: PRESET_COLORS[0],
      icon: AVAILABLE_ICONS[0],
      isEditing: true,
      isNew: true
    };

    setInstitutions(prev => [newInstitution, ...prev.map(inst => ({ ...inst, isEditing: false }))]);
  };

  const updateInstitutionField = (id: string, field: string, value: any) => {
    setInstitutions(prev => prev.map(inst =>
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const saveInstitution = async (id: string) => {
    const institution = institutions.find(inst => inst.id === id);
    if (!institution) return;

    // Validaciones básicas
    if (!institution.name.trim() || !institution.displayName.trim() || !institution.credentialMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Todos los campos principales son obligatorios.",
      });
      return;
    }

    // Validar keywords y variants
    if (institution.keywords.length === 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe agregar al menos una keyword.",
      });
      return;
    }

    if (institution.variants.length === 0) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe agregar al menos una variante de búsqueda.",
      });
      return;
    }

    try {
      // Preparar lista actualizada de instituciones
      const updatedInstitutions = institutions.map(inst =>
        inst.id === id ? { ...inst, isEditing: false, isNew: false } : inst
      ).filter(inst => inst.name.trim()); // Filtrar instituciones vacías

      // Usar el servicio de archivos para guardar
      const result = await InstitutionFileService.saveInstitutionsSafely(updatedInstitutions);

      if (result.success) {
        setInstitutions(updatedInstitutions);
        toast({
          title: "✅ Institución guardada",
          description: `${institution.displayName} se ha actualizado correctamente.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al guardar",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error saving institution:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la institución.",
      });
    }
  };

  const deleteInstitution = async (id: string) => {
    const institution = institutions.find(inst => inst.id === id);
    if (!institution) return;

    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de eliminar "${institution.displayName}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      const updatedInstitutions = institutions.filter(inst => inst.id !== id);
      const result = await InstitutionFileService.saveInstitutionsSafely(updatedInstitutions);

      if (result.success) {
        setInstitutions(updatedInstitutions);
        toast({
          title: "🗑️ Institución eliminada",
          description: `${institution.displayName} ha sido eliminada correctamente.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la institución.",
      });
    }
  };

  const simulateSaveToFile = async (institutionsToSave: EditableInstitution[]) => {
    // Simular delay de escritura de archivo
    await new Promise(resolve => setTimeout(resolve, 500));

    // En implementación real, aquí se escribiría el archivo institutionDetector.ts
    // Simulación: generación de código TypeScript
    const generatedCode = generateTypeScriptCode(institutionsToSave);
  };

  const generateTypeScriptCode = (institutionsToSave: EditableInstitution[]) => {
    return `// Auto-generated by Institution Manager
const INSTITUTIONS: InstitutionInfo[] = [
${institutionsToSave.map(inst => `  {
    id: '${inst.id}',
    name: '${inst.name}',
    displayName: '${inst.displayName}',
    credentialMessage: '${inst.credentialMessage}',
    keywords: ${JSON.stringify(inst.keywords)},
    variants: ${JSON.stringify(inst.variants)},
    color: ${JSON.stringify(inst.color, null, 6)},
    icon: '${inst.icon}'
  }`).join(',\n')}
];`;
  };

  const renderInstitutionCard = (institution: EditableInstitution) => {
    if (institution.isEditing) {
      return (
        <Card key={institution.id} className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:bg-gray-800 dark:border-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
              <span className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{institution.isNew ? 'Nueva Institución' : 'Editando Institución'}</span>
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => saveInstitution(institution.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelEditing(institution.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`name-${institution.id}`} className="text-gray-900 dark:text-gray-100 font-medium">Nombre Interno</Label>
                <Input
                  id={`name-${institution.id}`}
                  value={institution.name}
                  onChange={(e) => updateInstitutionField(institution.id, 'name', e.target.value.toUpperCase())}
                  placeholder="NOMBRE_INSTITUCION"
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor={`displayName-${institution.id}`} className="text-gray-900 dark:text-gray-100 font-medium">Nombre Público</Label>
                <Input
                  id={`displayName-${institution.id}`}
                  value={institution.displayName}
                  onChange={(e) => updateInstitutionField(institution.id, 'displayName', e.target.value)}
                  placeholder="Nombre para mostrar al usuario"
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Mensaje de credencial */}
            <div>
              <Label htmlFor={`message-${institution.id}`} className="text-gray-900 dark:text-gray-100 font-medium">Mensaje de Credencial</Label>
              <Textarea
                id={`message-${institution.id}`}
                value={institution.credentialMessage}
                onChange={(e) => updateInstitutionField(institution.id, 'credentialMessage', e.target.value)}
                placeholder="Los funcionarios de [Institución] deben presentar..."
                rows={3}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Icono y Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 dark:text-gray-100 font-medium">Icono</Label>
                <Select
                  value={institution.icon}
                  onValueChange={(value) => updateInstitutionField(institution.id, 'icon', value)}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {AVAILABLE_ICONS.map(icon => (
                      <SelectItem key={icon} value={icon} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                        <span className="text-xl mr-2">{icon}</span>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900 dark:text-gray-100 font-medium">Esquema de Color</Label>
                <Select
                  value={JSON.stringify(institution.color)}
                  onValueChange={(value) => updateInstitutionField(institution.id, 'color', JSON.parse(value))}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {PRESET_COLORS.map(color => (
                      <SelectItem key={color.name} value={JSON.stringify(color)} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border`}></div>
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <Label className="text-gray-900 dark:text-gray-100 font-medium">Keywords (separadas por coma)</Label>
              <Input
                value={institution.keywords.join(', ')}
                onChange={(e) => updateInstitutionField(institution.id, 'keywords',
                  e.target.value.split(',').map(k => k.trim()).filter(k => k)
                )}
                placeholder="palabra1, palabra2, palabra3"
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Variants */}
            <div>
              <Label className="text-gray-900 dark:text-gray-100 font-medium">Variantes de Búsqueda (separadas por coma)</Label>
              <Textarea
                value={institution.variants.join(', ')}
                onChange={(e) => updateInstitutionField(institution.id, 'variants',
                  e.target.value.split(',').map(v => v.trim()).filter(v => v)
                )}
                placeholder="variante1, variante con errores, abreviacion, etc"
                rows={3}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Preview */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <Label className="text-gray-900 dark:text-gray-100 font-medium">Vista Previa del Aviso</Label>
              <div className={`p-4 rounded-lg border-2 ${institution.color.bg} ${institution.color.text} ${institution.color.border} mt-2 shadow-sm`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{institution.icon}</span>
                  <span className="font-semibold">{institution.displayName || 'Nombre de Institución'}</span>
                </div>
                <p className="text-sm">{institution.credentialMessage || 'Mensaje de credencial aparecerá aquí...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Vista normal (no editando)
    return (
      <Card key={institution.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${institution.color.bg} rounded-xl flex items-center justify-center ${institution.color.border} border-2`}>
                <span className="text-xl">{institution.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{institution.displayName}</h3>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{institution.name}</p>
                <Badge variant="outline" className="mt-1">
                  {institution.keywords.length} keywords • {institution.variants.length} variantes
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewInstitution(institution)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEditing(institution.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteInstitution(institution.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="text-sm text-gray-900 dark:text-gray-100">
            <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Mensaje de credencial:</p>
            <p className="italic text-gray-900 dark:text-gray-100 leading-relaxed">"{institution.credentialMessage}"</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-500">
      {/* Navigation Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-600 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">Gestionar Instituciones</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/" className="hidden sm:flex">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button onClick={addNewInstitution} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Institución</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Administrador de Instituciones
          </h1>
          <p className="text-gray-800 dark:text-gray-100 text-lg max-w-2xl mx-auto">
            Configura avisos especiales, mensajes de credencial y variantes de búsqueda para instituciones que requieren documentación específica.
          </p>
        </div>


      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{institutions.length}</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">Instituciones Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{institutions.filter(i => i.isEditing).length}</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">En Edición</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {institutions.reduce((acc, inst) => acc + inst.variants.length, 0)}
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">Total Variantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Lista de instituciones */}
        <div className="space-y-4">
          {institutions.map(renderInstitutionCard)}
        </div>

        {/* Footer con navegación adicional */}
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-600 mt-12">
          <Link to="/" className="inline-flex items-center space-x-2 text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Regresar al Panel de Administración</span>
          </Link>
        </div>
      </div>

      {/* Modal de preview */}
      {previewInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vista Previa: {previewInstitution.displayName}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewInstitution(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview del aviso */}
              <div className={`p-6 rounded-lg border-2 ${previewInstitution.color.bg} ${previewInstitution.color.text} ${previewInstitution.color.border}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{previewInstitution.icon}</span>
                  <span className="font-bold text-lg">{previewInstitution.displayName}</span>
                </div>
                <p className="font-medium">{previewInstitution.credentialMessage}</p>
              </div>

              {/* Detalles técnicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Keywords</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewInstitution.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Variantes ({previewInstitution.variants.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                    {previewInstitution.variants.slice(0, 10).map((variant, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {variant}
                      </Badge>
                    ))}
                    {previewInstitution.variants.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{previewInstitution.variants.length - 10} más
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}