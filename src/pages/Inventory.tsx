import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Warehouse,
  Search,
  Filter,
  Calendar,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from "lucide-react";

interface ReagentStock {
  id: string;
  name: string;
  lot: string;
  unit: string;
  location: string;
  manufacturer: string;
  expiryDate: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  status: "normal" | "low" | "critical" | "expired";
}

interface Unit {
  id: string;
  name: string;
  totalReagents: number;
  lowStockCount: number;
}

export default function Inventory() {
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Mock data
  const units: Unit[] = [
    { id: "lab-central", name: "Lab Central", totalReagents: 45, lowStockCount: 3 },
    { id: "lab-norte", name: "Lab Norte", totalReagents: 32, lowStockCount: 1 },
    { id: "lab-sul", name: "Lab Sul", totalReagents: 28, lowStockCount: 2 },
    { id: "lab-oeste", name: "Lab Oeste", totalReagents: 51, lowStockCount: 2 },
  ];

  const reagentStock: ReagentStock[] = [
    {
      id: "1",
      name: "Glicose Oxidase",
      lot: "LOT2024001",
      unit: "Lab Central",
      location: "Geladeira A2",
      manufacturer: "BioTech Labs",
      expiryDate: "2024-12-15",
      totalQuantity: 100,
      availableQuantity: 75,
      reservedQuantity: 15,
      minimumStock: 20,
      status: "normal",
    },
    {
      id: "2",
      name: "Colesterol HDL",
      lot: "LOT2024002",
      unit: "Lab Norte",
      location: "Prateleira B1",
      manufacturer: "DiagCorp",
      expiryDate: "2024-11-30",
      totalQuantity: 50,
      availableQuantity: 8,
      reservedQuantity: 5,
      minimumStock: 15,
      status: "low",
    },
    {
      id: "3",
      name: "Triglicerídeos",
      lot: "LOT2024003",
      unit: "Lab Sul",
      location: "Geladeira C1",
      manufacturer: "LabMax",
      expiryDate: "2025-01-20",
      totalQuantity: 80,
      availableQuantity: 65,
      reservedQuantity: 10,
      minimumStock: 25,
      status: "normal",
    },
    {
      id: "4",
      name: "Creatinina",
      lot: "LOT2024004",
      unit: "Lab Central",
      location: "Armário D3",
      manufacturer: "ReagentPlus",
      expiryDate: "2024-10-15",
      totalQuantity: 30,
      availableQuantity: 5,
      reservedQuantity: 2,
      minimumStock: 10,
      status: "critical",
    },
  ];

  const filteredReagents = reagentStock.filter((reagent) => {
    const matchesSearch = reagent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reagent.lot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = selectedUnit === "all" || reagent.unit === units.find(u => u.id === selectedUnit)?.name;
    const matchesStatus = filterStatus === "all" || reagent.status === filterStatus;
    
    return matchesSearch && matchesUnit && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "default";
      case "low": return "secondary";
      case "critical": return "destructive";
      case "expired": return "destructive";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "normal": return "Normal";
      case "low": return "Estoque Baixo";
      case "critical": return "Crítico";
      case "expired": return "Vencido";
      default: return status;
    }
  };

  const calculateStockPercentage = (available: number, total: number) => {
    return Math.round((available / total) * 100);
  };

  const makeReservation = (reagentId: string, quantity: number) => {
    // Em produção, faria a chamada para o Supabase
    toast({
      title: "Reserva realizada",
      description: `${quantity} unidades reservadas com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-primary" />
          Estoque Virtual
        </h1>
        <p className="text-muted-foreground">Controle de disponibilidade e reservas por unidade</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {units.map((unit) => (
          <Card key={unit.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedUnit(unit.id)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{unit.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{unit.totalReagents}</div>
              <p className="text-xs text-muted-foreground">
                {unit.lowStockCount > 0 && (
                  <span className="text-warning">{unit.lowStockCount} com estoque baixo</span>
                )}
                {unit.lowStockCount === 0 && "Todos os estoques normais"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar reagente ou lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stock List */}
      <div className="grid gap-4">
        {filteredReagents.map((reagent) => (
          <Card key={reagent.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{reagent.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Lote: {reagent.lot}</span>
                    <span>•</span>
                    <span>{reagent.manufacturer}</span>
                    <span>•</span>
                    <span>{reagent.unit}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(reagent.status)}>
                    {getStatusLabel(reagent.status)}
                  </Badge>
                  {reagent.status === "critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Disponível</span>
                    <span className="font-semibold text-success">{reagent.availableQuantity} ml</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reservado</span>
                    <span className="font-semibold text-warning">{reagent.reservedQuantity} ml</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{reagent.totalQuantity} ml</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Localização</span>
                    <span className="font-medium">{reagent.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Validade</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(reagent.expiryDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estoque Mínimo</span>
                    <span className="font-medium">{reagent.minimumStock} ml</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Nível do Estoque</span>
                      <span className="font-medium">{calculateStockPercentage(reagent.availableQuantity, reagent.totalQuantity)}%</span>
                    </div>
                    <Progress 
                      value={calculateStockPercentage(reagent.availableQuantity, reagent.totalQuantity)} 
                      className="h-2"
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => makeReservation(reagent.id, 5)}
                  >
                    Fazer Reserva
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReagents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum reagente encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}