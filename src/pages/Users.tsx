import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Edit,
  Shield,
  User,
  Mail,
  Building2,
  MoreHorizontal,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'technician' | 'auditor';
  unit_id: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  units: { name: string; location: string };
  auth_users?: { email: string };
}

interface Unit {
  id: string;
  name: string;
  location: string;
}

export default function Users() {
  const { toast } = useToast();
  const { profile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    full_name: "",
    role: "" as 'admin' | 'manager' | 'technician' | 'auditor',
    unit_id: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setEditFormData({
        full_name: editingUser.full_name,
        role: editingUser.role,
        unit_id: editingUser.unit_id,
        is_active: editingUser.is_active,
      });
    }
  }, [editingUser]);

  const fetchData = async () => {
    try {
      // Fetch units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true);

      // Fetch profiles with related data
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          *,
          units(name, location)
        `)
        .order('created_at', { ascending: false });

      setUnits(unitsData || []);
      setProfiles((profilesData as Profile[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          role: editFormData.role,
          unit_id: editFormData.unit_id,
          is_active: editFormData.is_active,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Usuário atualizado!",
        description: `Dados de ${editFormData.full_name} foram atualizados com sucesso.`,
      });

      setIsDialogOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    const matchesUnit = unitFilter === "all" || profile.unit_id === unitFilter;
    return matchesSearch && matchesRole && matchesUnit;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "technician": return "secondary";
      case "auditor": return "outline";
      default: return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "manager": return "Gerente";
      case "technician": return "Técnico";
      case "auditor": return "Auditor";
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if current user is admin
  const isAdmin = currentUserProfile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o gerenciamento de usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground">Gerencie perfis e permissões dos usuários do sistema</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                      {!profile.is_active && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <Badge variant={getRoleColor(profile.role)}>
                          {getRoleLabel(profile.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{profile.units.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Cadastrado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Dialog open={isDialogOpen && editingUser?.id === profile.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(profile);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                          Altere as informações e permissões do usuário
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nome Completo</Label>
                          <Input
                            id="edit-name"
                            value={editFormData.full_name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-role">Função</Label>
                          <Select 
                            value={editFormData.role} 
                            onValueChange={(value: 'admin' | 'manager' | 'technician' | 'auditor') => 
                              setEditFormData(prev => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="manager">Gerente</SelectItem>
                              <SelectItem value="technician">Técnico</SelectItem>
                              <SelectItem value="auditor">Auditor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-unit">Unidade</Label>
                          <Select 
                            value={editFormData.unit_id} 
                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, unit_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <Select 
                            value={editFormData.is_active ? "active" : "inactive"} 
                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, is_active: value === "active" }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleEditUser} disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProfiles.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros de busca.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{profiles.length}</div>
            <p className="text-sm text-muted-foreground">Total de usuários</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {profiles.filter(p => p.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {profiles.filter(p => p.role === 'admin').length}
            </div>
            <p className="text-sm text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {profiles.filter(p => p.role === 'technician').length}
            </div>
            <p className="text-sm text-muted-foreground">Técnicos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}