import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  User,
  Package,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Minus,
  Plus,
} from "lucide-react";

interface ConsumptionLog {
  id: string;
  reagentName: string;
  reagentLot: string;
  action: "consumption" | "registration" | "reservation" | "adjustment";
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  unit: string;
  user: string;
  userRole: string;
  unitLocation: string;
  timestamp: string;
  notes: string;
  ipAddress: string;
  deviceInfo: string;
}

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Mock data para demonstração
  const logs: ConsumptionLog[] = [
    {
      id: "1",
      reagentName: "Glicose Oxidase",
      reagentLot: "LOT2024001",
      action: "consumption",
      quantityBefore: 80,
      quantityAfter: 75,
      quantityChanged: 5,
      unit: "ml",
      user: "João Silva",
      userRole: "Técnico de Laboratório",
      unitLocation: "Lab Central",
      timestamp: "2024-01-20T14:30:00Z",
      notes: "Consumo para exame de glicemia - Paciente: Maria Santos",
      ipAddress: "192.168.1.101",
      deviceInfo: "Chrome/Windows",
    },
    {
      id: "2",
      reagentName: "Colesterol HDL",
      reagentLot: "LOT2024002",
      action: "registration",
      quantityBefore: 0,
      quantityAfter: 50,
      quantityChanged: 50,
      unit: "ml",
      user: "Ana Costa",
      userRole: "Farmacêutica",
      unitLocation: "Lab Norte",
      timestamp: "2024-01-20T13:45:00Z",
      notes: "Cadastro de novo lote recebido",
      ipAddress: "192.168.1.102",
      deviceInfo: "Safari/macOS",
    },
    {
      id: "3",
      reagentName: "Triglicerídeos",
      reagentLot: "LOT2024003",
      action: "reservation",
      quantityBefore: 75,
      quantityAfter: 75,
      quantityChanged: 10,
      unit: "ml",
      user: "Pedro Santos",
      userRole: "Biomédico",
      unitLocation: "Lab Sul",
      timestamp: "2024-01-20T12:15:00Z",
      notes: "Reserva para exames agendados - 5 pacientes",
      ipAddress: "192.168.1.103",
      deviceInfo: "Chrome/Android",
    },
    {
      id: "4",
      reagentName: "Creatinina",
      reagentLot: "LOT2024004",
      action: "consumption",
      quantityBefore: 12,
      quantityAfter: 7,
      quantityChanged: 5,
      unit: "ml",
      user: "Mariana Oliveira",
      userRole: "Técnica de Laboratório",
      unitLocation: "Lab Central",
      timestamp: "2024-01-20T11:20:00Z",
      notes: "Consumo para exame de função renal",
      ipAddress: "192.168.1.104",
      deviceInfo: "Firefox/Windows",
    },
    {
      id: "5",
      reagentName: "Glicose Oxidase",
      reagentLot: "LOT2024001",
      action: "adjustment",
      quantityBefore: 75,
      quantityAfter: 72,
      quantityChanged: 3,
      unit: "ml",
      user: "Carlos Admin",
      userRole: "Administrador",
      unitLocation: "Lab Central",
      timestamp: "2024-01-20T10:45:00Z",
      notes: "Ajuste de estoque - perda por evaporação",
      ipAddress: "192.168.1.100",
      deviceInfo: "Chrome/Windows",
    },
  ];

  const units = ["Lab Central", "Lab Norte", "Lab Sul", "Lab Oeste"];
  const users = [...new Set(logs.map(log => log.user))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.reagentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.reagentLot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === "all" || log.user === selectedUser;
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesUnit = selectedUnit === "all" || log.unitLocation === selectedUnit;
    
    const logDate = new Date(log.timestamp);
    const matchesDateFrom = !dateFrom || logDate >= dateFrom;
    const matchesDateTo = !dateTo || logDate <= dateTo;
    
    return matchesSearch && matchesUser && matchesAction && matchesUnit && matchesDateFrom && matchesDateTo;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "consumption": return <Minus className="h-4 w-4" />;
      case "registration": return <Plus className="h-4 w-4" />;
      case "reservation": return <Clock className="h-4 w-4" />;
      case "adjustment": return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "consumption": return "destructive";
      case "registration": return "default";
      case "reservation": return "secondary";
      case "adjustment": return "outline";
      default: return "default";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "consumption": return "Consumo";
      case "registration": return "Cadastro";
      case "reservation": return "Reserva";
      case "adjustment": return "Ajuste";
      default: return action;
    }
  };

  const exportLogs = () => {
    // Em produção, faria export real dos dados
    const csvContent = [
      ["Data/Hora", "Reagente", "Lote", "Ação", "Usuário", "Unidade", "Qtd. Anterior", "Qtd. Posterior", "Diferença", "Observações"].join(","),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.reagentName,
        log.reagentLot,
        getActionLabel(log.action),
        log.user,
        log.unitLocation,
        log.quantityBefore,
        log.quantityAfter,
        log.action === "reservation" ? log.quantityChanged : log.quantityChanged,
        `"${log.notes}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `logs-reagentes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Logs de Consumo
        </h1>
        <p className="text-muted-foreground">Histórico completo de movimentações e auditoria</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtros e Busca</span>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por reagente, lote, usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="consumption">Consumo</SelectItem>
                <SelectItem value="registration">Cadastro</SelectItem>
                <SelectItem value="reservation">Reserva</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {(dateFrom || dateTo || searchTerm || selectedUser !== "all" || selectedAction !== "all" || selectedUnit !== "all") && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filtros ativos:</span>
              {searchTerm && <Badge variant="secondary">Busca: {searchTerm}</Badge>}
              {selectedUser !== "all" && <Badge variant="secondary">Usuário: {selectedUser}</Badge>}
              {selectedAction !== "all" && <Badge variant="secondary">Ação: {getActionLabel(selectedAction)}</Badge>}
              {selectedUnit !== "all" && <Badge variant="secondary">Unidade: {selectedUnit}</Badge>}
              {dateFrom && <Badge variant="secondary">De: {format(dateFrom, "dd/MM/yyyy")}</Badge>}
              {dateTo && <Badge variant="secondary">Até: {format(dateTo, "dd/MM/yyyy")}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{filteredLogs.length}</div>
            <p className="text-sm text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {filteredLogs.filter(log => log.action === "consumption").length}
            </div>
            <p className="text-sm text-muted-foreground">Consumos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {filteredLogs.filter(log => log.action === "registration").length}
            </div>
            <p className="text-sm text-muted-foreground">Cadastros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {filteredLogs.filter(log => log.action === "reservation").length}
            </div>
            <p className="text-sm text-muted-foreground">Reservas</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant={getActionColor(log.action)} className="flex items-center gap-1">
                    {getActionIcon(log.action)}
                    {getActionLabel(log.action)}
                  </Badge>
                  <div>
                    <h3 className="text-lg font-semibold">{log.reagentName}</h3>
                    <p className="text-sm text-muted-foreground">Lote: {log.reagentLot}</p>
                  </div>
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  <p>{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                  <p className="flex items-center gap-1 justify-end">
                    <User className="h-3 w-3" />
                    {log.user}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantidade Anterior:</span>
                    <span className="font-medium">{log.quantityBefore} {log.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantidade Posterior:</span>
                    <span className="font-medium">{log.quantityAfter} {log.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Diferença:</span>
                    <span className={`font-medium ${
                      log.action === "consumption" || log.action === "adjustment" 
                        ? "text-destructive" 
                        : "text-success"
                    }`}>
                      {log.action === "reservation" ? `${log.quantityChanged} reservados` : 
                       log.action === "consumption" || log.action === "adjustment" ? `-${log.quantityChanged}` : 
                       `+${log.quantityChanged}`} {log.unit}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unidade:</span>
                    <span className="font-medium">{log.unitLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Função:</span>
                    <span className="font-medium">{log.userRole}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Device:</span>
                    <span className="font-medium text-xs">{log.deviceInfo}</span>
                  </div>
                </div>
              </div>

              {log.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Observações:</p>
                      <p className="text-sm text-muted-foreground">{log.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}