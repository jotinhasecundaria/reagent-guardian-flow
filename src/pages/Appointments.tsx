import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  User,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Calendar as CalendarIconLarge,
  FlaskConical,
} from "lucide-react";

interface ExamType {
  id: string;
  name: string;
  description: string;
  required_reagents: any;
}

interface Unit {
  id: string;
  name: string;
  location: string;
}

interface Appointment {
  id: string;
  exam_type_id: string;
  exam_types: ExamType;
  patient_name: string;
  unit_id: string;
  units: Unit;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  notes: string;
  created_by: string;
  profiles: { full_name: string };
}

export default function Appointments() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    exam_type_id: "",
    patient_name: "",
    unit_id: profile?.unit_id || "",
    scheduled_date: new Date(),
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch exam types
      const { data: examTypesData } = await supabase
        .from('exam_types')
        .select('*')
        .eq('is_active', true);

      // Fetch units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true);

      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          exam_types(*),
          units(*),
          profiles(full_name)
        `)
        .order('scheduled_date', { ascending: true });

      setExamTypes((examTypesData as ExamType[]) || []);
      setUnits(unitsData || []);
      setAppointments((appointmentsData as unknown as Appointment[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          exam_type_id: formData.exam_type_id,
          patient_name: formData.patient_name,
          unit_id: formData.unit_id,
          scheduled_date: formData.scheduled_date.toISOString(),
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create reservations for required reagents
      const selectedExamType = examTypes.find(et => et.id === formData.exam_type_id);
      if (selectedExamType && selectedExamType.required_reagents.length > 0) {
        for (const reagent of selectedExamType.required_reagents) {
          // Find available reagent lot
          const { data: availableLots } = await supabase
            .from('reagent_lots')
            .select('*')
            .eq('unit_id', formData.unit_id)
            .gte('current_quantity', reagent.quantity)
            .eq('status', 'active')
            .order('expiry_date', { ascending: true })
            .limit(1);

          if (availableLots && availableLots.length > 0) {
            const lot = availableLots[0];
            
            // Create reservation
            await supabase
              .from('reagent_reservations')
              .insert({
                reagent_lot_id: lot.id,
                appointment_id: appointment.id,
                quantity_reserved: reagent.quantity,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
                created_by: user.id,
              });

            // Update reserved quantity
            await supabase
              .from('reagent_lots')
              .update({
                reserved_quantity: lot.reserved_quantity + reagent.quantity
              })
              .eq('id', lot.id);
          }
        }
      }

      toast({
        title: "Agendamento criado!",
        description: `Exame agendado para ${formData.patient_name}`,
      });

      // Reset form
      setFormData({
        exam_type_id: "",
        patient_name: "",
        unit_id: profile?.unit_id || "",
        scheduled_date: new Date(),
        notes: "",
      });
      
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await supabase
        .from('appointments')
        .update({ 
          status,
          completed_by: status === 'completed' ? user?.id : null
        })
        .eq('id', id);

      toast({
        title: "Status atualizado",
        description: "Status do agendamento foi atualizado com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.exam_types.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "in_progress": return "secondary";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Agendado";
      case "in_progress": return "Em Andamento";
      case "completed": return "Concluído";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CalendarIconLarge className="h-8 w-8 text-primary" />
            Agendamentos
          </h1>
          <p className="text-muted-foreground">Gerencie agendamentos de exames e reservas de reagentes</p>
        </div>
        
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente ou exame..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>Agende um exame e reserve os reagentes necessários</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Nome do Paciente *</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                    placeholder="Nome completo do paciente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam_type">Tipo de Exame *</Label>
                  <Select 
                    value={formData.exam_type_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, exam_type_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de exame" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((examType) => (
                        <SelectItem key={examType.id} value={examType.id}>
                          {examType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade *</Label>
                  <Select 
                    value={formData.unit_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
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
                  <Label>Data e Hora *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.scheduled_date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduled_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o agendamento..."
                  rows={3}
                />
              </div>

              {/* Required Reagents Preview */}
              {formData.exam_type_id && (
                <div className="space-y-2">
                  <Label>Reagentes Necessários</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    {examTypes
                      .find(et => et.id === formData.exam_type_id)
                      ?.required_reagents.map((reagent, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FlaskConical className="h-4 w-4 text-primary" />
                          <span>{reagent.reagent_name}: {reagent.quantity} unidades</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Agendamento"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {appointment.exam_types.name} - {appointment.units.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(appointment.status)}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                  
                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(appointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Criado por: {appointment.profiles.full_name}</span>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAppointments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIconLarge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca." 
                  : "Clique em 'Novo Agendamento' para começar."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}