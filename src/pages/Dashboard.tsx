import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalReagents: 0,
    lowStock: 0,
    expiringSoon: 0,
    consumptionToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stockByUnit, setStockByUnit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      // Carregar estatísticas de reagentes
      const { data: reagentLots } = await supabase
        .from('reagent_lots')
        .select(`
          id,
          current_quantity,
          minimum_stock,
          expiry_date,
          status,
          unit_id,
          reagents (name, unit_measure),
          units (name)
        `)
        .eq('status', 'active');

      if (reagentLots) {
        const total = reagentLots.length;
        const lowStock = reagentLots.filter(lot => lot.current_quantity <= lot.minimum_stock).length;
        const today = new Date();
        const expiringSoon = reagentLots.filter(lot => {
          const expiryDate = new Date(lot.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
        }).length;

        setStats(prev => ({
          ...prev,
          totalReagents: total,
          lowStock,
          expiringSoon,
        }));

        // Agrupar por unidade
        const unitStats = reagentLots.reduce((acc: any, lot) => {
          const unitName = lot.units?.name || 'Unidade não definida';
          if (!acc[unitName]) {
            acc[unitName] = { unit: unitName, total: 0, available: 0, reserved: 0 };
          }
          acc[unitName].total += 1;
          acc[unitName].available += lot.current_quantity;
          return acc;
        }, {});

        const stockData = Object.values(unitStats).map((unit: any) => ({
          ...unit,
          percentage: Math.round((unit.available / (unit.available + unit.reserved || 1)) * 100)
        }));

        setStockByUnit(stockData);
      }

      // Carregar atividade recente
      const { data: logs } = await supabase
        .from('consumption_logs')
        .select(`
          id,
          action_type,
          quantity_changed,
          created_at,
          user_id,
          reagent_lots (
            reagents (name),
            units (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (logs) {
        const activity = logs.map(log => ({
          id: log.id,
          reagent: log.reagent_lots?.reagents?.name || 'Reagente',
          action: log.action_type === 'consume' ? 'Consumo' : 
                  log.action_type === 'register' ? 'Cadastro' : 
                  log.action_type === 'transfer' ? 'Transferência' : 'Ação',
          user: log.user_id || 'Usuário',
          time: new Date(log.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          unit: log.reagent_lots?.units?.name || 'Unidade'
        }));

        setRecentActivity(activity);

        // Contar consumos de hoje
        const todayLogs = logs.filter(log => {
          const logDate = new Date(log.created_at).toDateString();
          const today = new Date().toDateString();
          return logDate === today && log.action_type === 'consume';
        });

        setStats(prev => ({
          ...prev,
          consumptionToday: todayLogs.length
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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