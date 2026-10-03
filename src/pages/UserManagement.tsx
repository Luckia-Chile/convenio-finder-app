import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Role = 'admin' | 'consultor';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

const roleLabel = (r: Role) => (r === 'admin' ? 'Administrador' : 'Consultor');

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca';

const UserManagementContent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pendingRole, setPendingRole] = useState<{ user: ManagedUser; newRole: Role } | null>(null);
  const [pendingReset, setPendingReset] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('consultor');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_users_with_roles');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la lista de usuarios.' });
    } else {
      setUsers((data ?? []) as ManagedUser[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const fail = (title: string, message: string) =>
    toast({ variant: 'destructive', title, description: message });

  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    setSaving(true);
    const { error } = await supabase.rpc('set_user_role', {
      target_user: pendingRole.user.id,
      new_role: pendingRole.newRole,
    });
    setSaving(false);
    if (error) {
      fail('No se pudo cambiar el rol', error.message);
    } else {
      toast({
        title: 'Rol actualizado',
        description: `${pendingRole.user.email} ahora es ${roleLabel(pendingRole.newRole)}.`,
      });
      await loadUsers();
    }
    setPendingRole(null);
  };

  const closeReset = () => {
    setPendingReset(null);
    setResetPassword('');
    setShowResetPassword(false);
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingReset) return;
    setSaving(true);
    const { data, error } = await supabase.rpc('admin_reset_password', {
      target_user: pendingReset.id,
      new_password: resetPassword,
    });
    setSaving(false);
    if (error || !data) {
      fail('No se pudo restablecer la contraseña', error?.message ?? 'Respuesta vacía');
      return;
    }
    toast({
      title: 'Contraseña actualizada',
      description: `${pendingReset.email} debe iniciar sesión con la nueva contraseña.`,
    });
    closeReset();
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.rpc('admin_create_user', {
      new_email: newEmail,
      new_password: newPassword,
      new_full_name: newName,
      new_role: newRole,
    });
    setSaving(false);
    if (error || !data) {
      fail('No se pudo crear el usuario', error?.message ?? 'Respuesta vacía');
      return;
    }
    const res = data as { email: string };
    setCreateOpen(false);
    setNewEmail('');
    setNewName('');
    setNewRole('consultor');
    setNewPassword('');
    setShowNewPassword(false);
    toast({ title: 'Usuario creado', description: `${res.email} ya puede iniciar sesión con la contraseña que definiste.` });
    await loadUsers();
  };

  const admins = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <Header />
      <main className="max-w-5xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de usuarios
              </CardTitle>
              <CardDescription>
                {users.length} usuarios · {admins} administradores. Los cambios son inmediatos y quedan en el
                registro de auditoría.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo usuario
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Cargando usuarios…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden md:table-cell">Último acceso</TableHead>
                      <TableHead className="w-44">Cambiar rol</TableHead>
                      <TableHead className="w-28 text-right">Contraseña</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const isSelf = u.id === user?.id;
                      // Un super admin que ya es admin no se degrada; uno que aún es consultor sí se puede promover.
                      const roleLocked = isSelf || (u.is_super_admin && u.role === 'admin');
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium" translate="no">
                              {u.email}
                            </div>
                            {u.full_name && <div className="text-xs text-muted-foreground">{u.full_name}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{roleLabel(u.role)}</Badge>
                              {u.is_super_admin && (
                                <Badge variant="outline" className="gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Global
                                </Badge>
                              )}
                              {isSelf && <span className="text-xs text-muted-foreground">(tú)</span>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(u.last_sign_in_at)}
                          </TableCell>
                          <TableCell>
                            {roleLocked ? (
                              <span className="text-xs text-muted-foreground">No modificable</span>
                            ) : (
                              <Select
                                value={u.role}
                                onValueChange={(value) => {
                                  if (value !== u.role) setPendingRole({ user: u, newRole: value as Role });
                                }}
                              >
                                <SelectTrigger aria-label={`Rol de ${u.email}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="consultor">Consultor</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPendingReset(u)}
                              aria-label={`Restablecer contraseña de ${u.email}`}
                            >
                              <KeyRound className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-2">Restablecer</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cambio de rol */}
      <AlertDialog open={!!pendingRole} onOpenChange={(open) => !open && !saving && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar el rol?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRole && (
                <>
                  <span translate="no">{pendingRole.user.email}</span> pasará de{' '}
                  <strong>{roleLabel(pendingRole.user.role)}</strong> a <strong>{roleLabel(pendingRole.newRole)}</strong>.
                  {pendingRole.newRole === 'admin' &&
                    ' Podrá cargar y reemplazar los beneficiarios y administrar instituciones.'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                confirmRoleChange();
              }}
            >
              {saving ? 'Guardando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restablecer contraseña (la define quien administra) */}
      <Dialog open={!!pendingReset} onOpenChange={(open) => !open && !saving && closeReset()}>
        <DialogContent>
          <form onSubmit={submitReset} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Restablecer contraseña</DialogTitle>
              <DialogDescription>
                {pendingReset && (
                  <>
                    Define la nueva contraseña de <span translate="no">{pendingReset.email}</span>. Se cerrarán sus
                    sesiones abiertas y la contraseña anterior dejará de servir.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowResetPassword((v) => !v)}
                  aria-label={showResetPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeReset} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || resetPassword.length < 8}>
                {saving ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nuevo usuario */}
      <Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
        <DialogContent>
          <form onSubmit={submitCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
              <DialogDescription>
                Define la contraseña inicial y entrégasela a la persona por un canal seguro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-email">Correo</Label>
              <Input
                id="new-email"
                type="email"
                required
                autoComplete="off"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nombre@empresa.cl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Nombre completo</Label>
              <Input
                id="new-name"
                type="text"
                autoComplete="off"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Consultor (solo búsquedas)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !newEmail.trim() || newPassword.length < 8}>
                {saving ? 'Creando…' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

const UserManagement: React.FC = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <UserManagementContent />;
};

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <UserManagement />
    </ProtectedRoute>
  );
}
