import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Scan,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Package,
  User,
  Clock,
} from "lucide-react";

interface ScannedReagent {
  id: string;
  name: string;
  lot: string;
  manufacturer: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  location: string;
  registeredAt: string;
}

interface ConsumptionRecord {
  reagentId: string;
  quantityUsed: number;
  notes: string;
  user: string;
  timestamp: string;
}

export default function Scanner() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedData, setScannedData] = useState<ScannedReagent | null>(null);
  const [consumptionData, setConsumptionData] = useState({
    quantityUsed: "",
    notes: "",
    user: "João Silva", // Em produção viria da autenticação
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Simulação de leitura de QR code de arquivo
      // Em produção, usaria uma biblioteca como jsQR ou qr-scanner
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular processamento

      // Mock data que seria extraída do QR code
      const mockScannedData: ScannedReagent = {
        id: "1",
        name: "Glicose Oxidase",
        lot: "LOT2024001",
        manufacturer: "BioTech Labs",
        expiryDate: "2024-12-15",
        quantity: 75, // Quantidade atual disponível
        unit: "ml",
        location: "Geladeira A2",
        registeredAt: "2024-01-15T10:30:00Z",
      };

      setScannedData(mockScannedData);

      toast({
        title: "QR code lido com sucesso!",
        description: `Reagente identificado: ${mockScannedData.name}`,
      });

    } catch (error) {
      toast({
        title: "Erro ao ler QR code",
        description: "Não foi possível processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startCameraScanner = () => {
    // Em produção, abriria o scanner de câmera
    toast({
      title: "Scanner de câmera",
      description: "Funcionalidade será implementada com acesso à câmera do dispositivo.",
    });
  };

  const registerConsumption = async () => {
    if (!scannedData || !consumptionData.quantityUsed) {
      toast({
        title: "Dados incompletos",
        description: "Informe a quantidade consumida.",
        variant: "destructive",
      });
      return;
    }

    const quantityUsed = parseFloat(consumptionData.quantityUsed);
    if (quantityUsed > scannedData.quantity) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade consumida não pode ser maior que a disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simular registro no Supabase
      const consumptionRecord: ConsumptionRecord = {
        reagentId: scannedData.id,
        quantityUsed,
        notes: consumptionData.notes,
        user: consumptionData.user,
        timestamp: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Registro que seria salvo no Supabase:", consumptionRecord);

      toast({
        title: "Consumo registrado com sucesso!",
        description: `${quantityUsed} ${scannedData.unit} de ${scannedData.name} registrados.`,
      });

      // Atualizar a quantidade disponível localmente
      setScannedData(prev => prev ? {
        ...prev,
        quantity: prev.quantity - quantityUsed
      } : null);

      // Limpar form
      setConsumptionData({
        quantityUsed: "",
        notes: "",
        user: consumptionData.user,
      });

    } catch (error) {
      toast({
        title: "Erro ao registrar consumo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearScannedData = () => {
    setScannedData(null);
    setConsumptionData({
      quantityUsed: "",
      notes: "",
      user: consumptionData.user,
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Scan className="h-8 w-8 text-primary" />
          Leitura QR Code
        </h1>
        <p className="text-muted-foreground">Escaneie o QR code do reagente para registrar consumo</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner QR Code</CardTitle>
            <CardDescription>
              Escolha uma forma de ler o QR code do reagente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scannedData ? (
              <>
                <div className="grid gap-4">
                  <Button onClick={startCameraScanner} className="h-24 flex flex-col gap-2">
                    <Camera className="h-8 w-8" />
                    <span>Usar Câmera</span>
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="h-24 w-full flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      <Upload className="h-8 w-8" />
                      <span>{isProcessing ? "Processando..." : "Upload de Imagem"}</span>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Como usar:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use a câmera para leitura direta do QR code</li>
                    <li>• Ou faça upload de uma foto do QR code</li>
                    <li>• O sistema identificará automaticamente o reagente</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">QR Code Lido!</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearScannedData}>
                    Novo Scan
                  </Button>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{scannedData.name}</h3>
                    {isExpiringSoon(scannedData.expiryDate) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Vencendo
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Lote: {scannedData.lot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Validade: {new Date(scannedData.expiryDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Fabricante:</span>
                      <span>{scannedData.manufacturer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Local:</span>
                      <span>{scannedData.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Disponível:</span>
                      <span className="font-semibold text-success">
                        {scannedData.quantity} {scannedData.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consumption Form */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Consumo</CardTitle>
            <CardDescription>
              {scannedData 
                ? "Informe os dados do consumo do reagente" 
                : "Escaneie um QR code primeiro"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scannedData ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantityUsed">Quantidade Consumida *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantityUsed"
                      type="number"
                      value={consumptionData.quantityUsed}
                      onChange={(e) => setConsumptionData(prev => ({ 
                        ...prev, 
                        quantityUsed: e.target.value 
                      }))}
                      placeholder="0"
                      max={scannedData.quantity}
                    />
                    <div className="flex items-center px-3 border rounded-md bg-muted">
                      <span className="text-sm text-muted-foreground">{scannedData.unit}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Máximo disponível: {scannedData.quantity} {scannedData.unit}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user">Usuário</Label>
                  <Input
                    id="user"
                    value={consumptionData.user}
                    onChange={(e) => setConsumptionData(prev => ({ 
                      ...prev, 
                      user: e.target.value 
                    }))}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={consumptionData.notes}
                    onChange={(e) => setConsumptionData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Motivo do consumo, exame relacionado, etc..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data/Hora do Registro</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <Button 
                  onClick={registerConsumption} 
                  disabled={isProcessing || !consumptionData.quantityUsed}
                  className="w-full"
                >
                  {isProcessing ? "Registrando..." : "Registrar Consumo"}
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                <div className="text-center space-y-2">
                  <Scan className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Escaneie um QR code primeiro</p>
                  <p className="text-xs text-muted-foreground">
                    O formulário aparecerá após a leitura
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}