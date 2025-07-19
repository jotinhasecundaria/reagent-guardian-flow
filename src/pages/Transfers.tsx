import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRightLeft,
  Package,
  MapPin,
  Scan,
  CheckCircle,
  AlertTriangle,
  User,
  Clock,
} from "lucide-react";

interface ReagentLot {
  id: string;
  reagent_id: string;
  lot_number: string;
  current_quantity: number;
  location: string;
  reagents: {
    name: string;
    unit_measure: string;
  };
  criticality_level: string;
}

interface Transfer {
  id: string;
  reagent_lot_id: string;
  from_location: string;
  to_location: string;
  quantity: number;
  reason: string;
  transferred_by: string;
  transferred_at: string;
  status: 'pending' | 'completed';
}

export default function Transfers() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [reagentLots, setReagentLots] = useState<ReagentLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ReagentLot | null>(null);
  const [transferData, setTransferData] = useState({
    to_location: "",
    quantity: "",
    reason: "",
  });
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReagentLots();
    loadRecentTransfers();
  }, []);

  const loadReagentLots = async () => {
    try {
      const { data, error } = await supabase
        .from('reagent_lots')
        .select(`
          id,
          reagent_id,
          lot_number,
          current_quantity,
          location,
          criticality_level,
          reagents (
            name,
            unit_measure
          )
        `)
        .gt('current_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReagentLots(data || []);
    } catch (error) {
      console.error('Error loading reagent lots:', error);
      toast({
        title: "Erro ao carregar lotes",
        description: "Não foi possível carregar os lotes de reagentes.",
        variant: "destructive",
      });
    }
  };

  const loadRecentTransfers = async () => {
    // Simulação - implementar quando tiver a tabela de transferências
    const mockTransfers: Transfer[] = [
      {
        id: '1',
        reagent_lot_id: '1',
        from_location: 'Geladeira A2',
        to_location: 'Laboratório 1',
        quantity: 50,
        reason: 'Transferência para exames urgentes',
        transferred_by: 'João Silva',
        transferred_at: new Date().toISOString(),
        status: 'completed'
      }
    ];
    setRecentTransfers(mockTransfers);
  };

  const executeTransfer = async () => {
    if (!selectedLot || !transferData.to_location || !transferData.quantity || !transferData.reason) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(transferData.quantity);
    if (quantity > selectedLot.current_quantity) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade a transferir não pode ser maior que a disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Registrar log de consumo como transferência
      const { error: logError } = await supabase
        .from('consumption_logs')
        .insert({
          reagent_lot_id: selectedLot.id,
          action_type: 'transfer',
          quantity_changed: quantity,
          quantity_before: selectedLot.current_quantity,
          quantity_after: selectedLot.current_quantity - quantity,
          notes: `Transferência: ${selectedLot.location} → ${transferData.to_location}. Motivo: ${transferData.reason}`,
          user_id: profile?.id,
        });

      if (logError) throw logError;

      // Atualizar a quantidade e localização do lote
      const { error: updateError } = await supabase
        .from('reagent_lots')
        .update({
          current_quantity: selectedLot.current_quantity - quantity,
          location: transferData.to_location,
        })
        .eq('id', selectedLot.id);

      if (updateError) throw updateError;

      // Registrar no blockchain se for reagente crítico
      if (selectedLot.criticality_level === 'critical') {
        const { error: blockchainError } = await supabase
          .from('blockchain_transactions')
          .insert({
            transaction_hash: `TRANSFER_${Date.now()}_${selectedLot.id}`,
            transaction_type: 'transfer',
            reagent_lot_id: selectedLot.id,
            data_hash: btoa(JSON.stringify({
              from: selectedLot.location,
              to: transferData.to_location,
              quantity,
              reason: transferData.reason,
              user: profile?.full_name,
            })),
          });

        if (blockchainError) throw blockchainError;
      }

      toast({
        title: "Transferência realizada com sucesso!",
        description: `${quantity} ${selectedLot.reagents.unit_measure} transferidos para ${transferData.to_location}.`,
      });

      // Resetar formulário
      setSelectedLot(null);
      setTransferData({
        to_location: "",
        quantity: "",
        reason: "",
      });

      // Recarregar dados
      loadReagentLots();
      loadRecentTransfers();

    } catch (error) {
      console.error('Error executing transfer:', error);
      toast({
        title: "Erro na transferência",
        description: "Não foi possível realizar a transferência. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectReagentLot = (lot: ReagentLot) => {
    setSelectedLot(lot);
    setTransferData({
      to_location: "",
      quantity: "",
      reason: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ArrowRightLeft className="h-8 w-8 text-primary" />
          Transferências Internas
        </h1>
        <p className="text-muted-foreground">Gerencie a movimentação de reagentes entre locais</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seleção de Lote */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Lote para Transferir</CardTitle>
            <CardDescription>
              Escolha o lote de reagente que deseja transferir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reagentLots.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum lote disponível</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {reagentLots.map((lot) => (
                    <div
                      key={lot.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLot?.id === lot.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectReagentLot(lot)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{lot.reagents.name}</h4>
                        {lot.criticality_level === 'critical' && (
                          <Badge variant="destructive">Crítico</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3" />
                          <span>Lote: {lot.lot_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>Local: {lot.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Disponível: </span>
                          <span className="font-semibold text-success">
                            {lot.current_quantity} {lot.reagents.unit_measure}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Transferência */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Transferência</CardTitle>
            <CardDescription>
              {selectedLot 
                ? "Informe os dados para a transferência" 
                : "Selecione um lote primeiro"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLot ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Lote Selecionado:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Reagente:</strong> {selectedLot.reagents.name}</p>
                    <p><strong>Lote:</strong> {selectedLot.lot_number}</p>
                    <p><strong>Local Atual:</strong> {selectedLot.location}</p>
                    <p><strong>Disponível:</strong> {selectedLot.current_quantity} {selectedLot.reagents.unit_measure}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to_location">Local de Destino *</Label>
                  <Select value={transferData.to_location} onValueChange={(value) => 
                    setTransferData(prev => ({ ...prev, to_location: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geladeira A1">Geladeira A1</SelectItem>
                      <SelectItem value="Geladeira A2">Geladeira A2</SelectItem>
                      <SelectItem value="Freezer D1">Freezer D1</SelectItem>
                      <SelectItem value="Prateleira B1">Prateleira B1</SelectItem>
                      <SelectItem value="Armário C3">Armário C3</SelectItem>
                      <SelectItem value="Laboratório 1">Laboratório 1</SelectItem>
                      <SelectItem value="Laboratório 2">Laboratório 2</SelectItem>
                      <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade a Transferir *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      value={transferData.quantity}
                      onChange={(e) => setTransferData(prev => ({ 
                        ...prev, 
                        quantity: e.target.value 
                      }))}
                      placeholder="0"
                      max={selectedLot.current_quantity}
                    />
                    <div className="flex items-center px-3 border rounded-md bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {selectedLot.reagents.unit_measure}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Máximo disponível: {selectedLot.current_quantity} {selectedLot.reagents.unit_measure}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da Transferência *</Label>
                  <Textarea
                    id="reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    placeholder="Ex: Transferência para laboratório de urgência, realocação por vencimento próximo..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{profile?.full_name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data/Hora</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {selectedLot.criticality_level === 'critical' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Reagente Crítico</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Esta transferência será registrada no blockchain para rastreabilidade completa.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={executeTransfer} 
                  disabled={isLoading || !transferData.to_location || !transferData.quantity || !transferData.reason}
                  className="w-full"
                >
                  {isLoading ? "Executando Transferência..." : "Executar Transferência"}
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                <div className="text-center space-y-2">
                  <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Selecione um lote primeiro</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transferências Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transferências Recentes</CardTitle>
          <CardDescription>Histórico das últimas transferências realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransfers.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma transferência registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {transfer.from_location} → {transfer.to_location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transfer.quantity} unidades • {transfer.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Por {transfer.transferred_by} • {new Date(transfer.transferred_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                    {transfer.status === 'completed' ? 'Concluída' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}