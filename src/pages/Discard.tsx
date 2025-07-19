import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2,
  Package,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileImage,
  Download,
} from "lucide-react";

interface ReagentLot {
  id: string;
  reagent_id: string;
  lot_number: string;
  current_quantity: number;
  location: string;
  expiry_date: string;
  reagents: {
    name: string;
    unit_measure: string;
  };
  criticality_level: string;
  status: string;
}

interface DiscardChecklist {
  id: string;
  item: string;
  checked: boolean;
  required: boolean;
}

const DISCARD_CHECKLIST: DiscardChecklist[] = [
  { id: '1', item: 'Verificar se o reagente está realmente vencido ou inutilizável', checked: false, required: true },
  { id: '2', item: 'Confirmar que não há utilização pendente ou reservas ativas', checked: false, required: true },
  { id: '3', item: 'Verificar se o recipiente está adequadamente identificado', checked: false, required: true },
  { id: '4', item: 'Confirmar que as medidas de segurança foram tomadas', checked: false, required: true },
  { id: '5', item: 'Documentar o motivo do descarte adequadamente', checked: false, required: true },
  { id: '6', item: 'Foto do recipiente foi tirada antes do descarte', checked: false, required: true },
  { id: '7', item: 'Autorização de supervisor foi obtida (se necessário)', checked: false, required: false },
];

export default function Discard() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reagentLots, setReagentLots] = useState<ReagentLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ReagentLot | null>(null);
  const [checklist, setChecklist] = useState<DiscardChecklist[]>(DISCARD_CHECKLIST);
  const [discardData, setDiscardData] = useState({
    reason: "",
    photos: [] as string[],
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDiscardableLots();
  }, []);

  const loadDiscardableLots = async () => {
    try {
      const { data, error } = await supabase
        .from('reagent_lots')
        .select(`
          id,
          reagent_id,
          lot_number,
          current_quantity,
          location,
          expiry_date,
          criticality_level,
          status,
          reagents (
            name,
            unit_measure
          )
        `)
        .in('status', ['active', 'expired'])
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setReagentLots(data || []);
    } catch (error) {
      console.error('Error loading reagent lots:', error);
      toast({
        title: "Erro ao carregar lotes",
        description: "Não foi possível carregar os lotes disponíveis para descarte.",
        variant: "destructive",
      });
    }
  };

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked } : item
      )
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setDiscardData(prev => ({
            ...prev,
            photos: [...prev.photos, e.target!.result as string]
          }));
          
          // Marcar item do checklist como concluído
          handleChecklistChange('6', true);
        }
      };
      reader.readAsDataURL(file);
    });

    toast({
      title: "Foto adicionada",
      description: "A foto foi anexada ao processo de descarte.",
    });
  };

  const removePhoto = (index: number) => {
    setDiscardData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));

    // Se não há mais fotos, desmarcar o checklist
    if (discardData.photos.length === 1) {
      handleChecklistChange('6', false);
    }
  };

  const isChecklistComplete = () => {
    const requiredItems = checklist.filter(item => item.required);
    return requiredItems.every(item => item.checked);
  };

  const executeDiscard = async () => {
    if (!selectedLot) {
      toast({
        title: "Lote não selecionado",
        description: "Selecione um lote para descartar.",
        variant: "destructive",
      });
      return;
    }

    if (!isChecklistComplete()) {
      toast({
        title: "Checklist incompleto",
        description: "Complete todos os itens obrigatórios do checklist.",
        variant: "destructive",
      });
      return;
    }

    if (!discardData.reason) {
      toast({
        title: "Motivo não informado",
        description: "Informe o motivo do descarte.",
        variant: "destructive",
      });
      return;
    }

    if (discardData.photos.length === 0) {
      toast({
        title: "Foto obrigatória",
        description: "É obrigatório anexar pelo menos uma foto do recipiente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Registrar log de descarte
      const { error: logError } = await supabase
        .from('consumption_logs')
        .insert({
          reagent_lot_id: selectedLot.id,
          action_type: 'dispose',
          quantity_changed: selectedLot.current_quantity,
          quantity_before: selectedLot.current_quantity,
          quantity_after: 0,
          notes: `Descarte: ${discardData.reason}. Checklist completado. ${discardData.notes ? `Observações: ${discardData.notes}` : ''}`,
          user_id: profile?.id,
        });

      if (logError) throw logError;

      // Atualizar status do lote para descartado
      const { error: updateError } = await supabase
        .from('reagent_lots')
        .update({
          status: 'disposed',
          current_quantity: 0,
        })
        .eq('id', selectedLot.id);

      if (updateError) throw updateError;

      // Registrar no blockchain se for reagente crítico
      if (selectedLot.criticality_level === 'critical') {
        const { error: blockchainError } = await supabase
          .from('blockchain_transactions')
          .insert({
            transaction_hash: `DISPOSE_${Date.now()}_${selectedLot.id}`,
            transaction_type: 'dispose',
            reagent_lot_id: selectedLot.id,
            data_hash: btoa(JSON.stringify({
              reason: discardData.reason,
              quantity: selectedLot.current_quantity,
              checklist_completed: true,
              photos_count: discardData.photos.length,
              user: profile?.full_name,
            })),
          });

        if (blockchainError) throw blockchainError;
      }

      // Gerar comprovante digital (mock)
      const certificate = {
        id: `CERT_${Date.now()}`,
        reagent: selectedLot.reagents.name,
        lot: selectedLot.lot_number,
        quantity: selectedLot.current_quantity,
        unit: selectedLot.reagents.unit_measure,
        reason: discardData.reason,
        discarded_by: profile?.full_name,
        discarded_at: new Date().toISOString(),
        checklist_items: checklist.filter(item => item.checked).length,
        photos_attached: discardData.photos.length,
        blockchain_registered: selectedLot.criticality_level === 'critical',
      };

      console.log('Comprovante de descarte gerado:', certificate);

      toast({
        title: "Descarte realizado com sucesso!",
        description: `${selectedLot.reagents.name} - Lote ${selectedLot.lot_number} foi descartado.`,
      });

      // Resetar formulário
      setSelectedLot(null);
      setChecklist(DISCARD_CHECKLIST);
      setDiscardData({
        reason: "",
        photos: [],
        notes: "",
      });

      // Recarregar dados
      loadDiscardableLots();

    } catch (error) {
      console.error('Error executing discard:', error);
      toast({
        title: "Erro no descarte",
        description: "Não foi possível realizar o descarte. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCertificate = () => {
    // Mock de geração de comprovante
    toast({
      title: "Comprovante gerado",
      description: "O comprovante digital foi gerado com sucesso.",
    });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Trash2 className="h-8 w-8 text-primary" />
          Descarte Seguro
        </h1>
        <p className="text-muted-foreground">Realize o descarte controlado de reagentes seguindo protocolos de segurança</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seleção de Lote */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Lote para Descarte</CardTitle>
            <CardDescription>
              Escolha o reagente que será descartado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reagentLots.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum lote disponível para descarte</p>
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
                      onClick={() => setSelectedLot(lot)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{lot.reagents.name}</h4>
                        <div className="flex gap-1">
                          {lot.criticality_level === 'critical' && (
                            <Badge variant="destructive">Crítico</Badge>
                          )}
                          {isExpired(lot.expiry_date) && (
                            <Badge variant="destructive">Vencido</Badge>
                          )}
                          {isExpiringSoon(lot.expiry_date) && !isExpired(lot.expiry_date) && (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                              Vence em breve
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Lote: {lot.lot_number}</p>
                        <p>Local: {lot.location}</p>
                        <p>Validade: {new Date(lot.expiry_date).toLocaleDateString('pt-BR')}</p>
                        <p>Quantidade: {lot.current_quantity} {lot.reagents.unit_measure}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist e Dados do Descarte */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist de Descarte</CardTitle>
            <CardDescription>
              {selectedLot 
                ? "Complete todos os itens obrigatórios" 
                : "Selecione um lote primeiro"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLot ? (
              <div className="space-y-6">
                {/* Informações do Lote Selecionado */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Lote Selecionado:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Reagente:</strong> {selectedLot.reagents.name}</p>
                    <p><strong>Lote:</strong> {selectedLot.lot_number}</p>
                    <p><strong>Quantidade:</strong> {selectedLot.current_quantity} {selectedLot.reagents.unit_measure}</p>
                    <p><strong>Validade:</strong> {new Date(selectedLot.expiry_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  <h4 className="font-medium">Checklist de Verificação:</h4>
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={item.id}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            item.required ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {item.item}
                          {item.required && <span className="text-destructive"> *</span>}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload de Fotos */}
                <div className="space-y-3">
                  <Label>Fotos do Recipiente *</Label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Adicionar Foto
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {discardData.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {discardData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Motivo do Descarte */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo do Descarte *</Label>
                  <Input
                    id="reason"
                    value={discardData.reason}
                    onChange={(e) => setDiscardData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    placeholder="Ex: Vencimento, contaminação, recipiente danificado..."
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações Adicionais</Label>
                  <Textarea
                    id="notes"
                    value={discardData.notes}
                    onChange={(e) => setDiscardData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Informações complementares sobre o descarte..."
                    rows={3}
                  />
                </div>

                {/* Status do Checklist */}
                <div className={`p-3 rounded-lg ${
                  isChecklistComplete() 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isChecklistComplete() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={`font-medium ${
                      isChecklistComplete() ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {isChecklistComplete() 
                        ? 'Checklist completo - Pronto para descarte' 
                        : 'Complete todos os itens obrigatórios'
                      }
                    </span>
                  </div>
                </div>

                {selectedLot.criticality_level === 'critical' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Reagente Crítico</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Este descarte será registrado no blockchain e um comprovante digital será gerado.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={executeDiscard} 
                  disabled={isLoading || !isChecklistComplete() || !discardData.reason || discardData.photos.length === 0}
                  className="w-full"
                  variant="destructive"
                >
                  {isLoading ? "Processando Descarte..." : "Realizar Descarte"}
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                <div className="text-center space-y-2">
                  <Trash2 className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Selecione um lote primeiro</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geração de Comprovante */}
      {selectedLot && isChecklistComplete() && (
        <Card>
          <CardHeader>
            <CardTitle>Comprovante de Descarte</CardTitle>
            <CardDescription>
              Após o descarte, um comprovante digital será gerado automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileImage className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Comprovante Digital de Descarte</p>
                  <p className="text-sm text-muted-foreground">
                    Documento com registro completo do processo de descarte
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={downloadCertificate}>
                <Download className="h-4 w-4 mr-2" />
                Gerar Comprovante
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}