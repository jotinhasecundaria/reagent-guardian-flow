import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  Users,
  Warehouse,
} from "lucide-react";

export default function Dashboard() {
  // Mock data para demonstração
  const stats = {
    totalReagents: 156,
    lowStock: 8,
    expiringSoon: 12,
    consumptionToday: 23,
  };

  const recentActivity = [
    { id: 1, reagent: "Reagente A", action: "Consumo", user: "João Silva", time: "14:30", unit: "Lab Central" },
    { id: 2, reagent: "Reagente B", action: "Cadastro", user: "Maria Santos", time: "13:45", unit: "Lab Norte" },
    { id: 3, reagent: "Reagente C", action: "Reserva", user: "Pedro Costa", time: "12:15", unit: "Lab Sul" },
  ];

  const stockByUnit = [
    { unit: "Lab Central", total: 45, available: 38, reserved: 7, percentage: 84 },
    { unit: "Lab Norte", total: 32, available: 29, reserved: 3, percentage: 91 },
    { unit: "Lab Sul", total: 28, available: 22, reserved: 6, percentage: 79 },
    { unit: "Lab Oeste", total: 51, available: 44, reserved: 7, percentage: 86 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do controle de reagentes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reagentes</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalReagents}</div>
            <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo Soon</CardTitle>
            <Calendar className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.consumptionToday}</div>
            <p className="text-xs text-muted-foreground">Registros de baixa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock by Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Estoque por Unidade
            </CardTitle>
            <CardDescription>Status atual do estoque virtual em cada laboratório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stockByUnit.map((item) => (
              <div key={item.unit} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.unit}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-success">{item.available} disp.</span>
                    <span className="text-warning">{item.reserved} res.</span>
                    <span className="text-muted-foreground">/ {item.total} total</span>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas movimentações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{activity.reagent}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.action === "Consumo" ? "destructive" : activity.action === "Cadastro" ? "default" : "secondary"}>
                      {activity.action}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}