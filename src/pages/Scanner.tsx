import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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
  StopCircle,
} from "lucide-react";

interface ScannedReagent {
  id: string;
  reagent_name: string;
  lot_number: string;
  manufacturer: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  location: string;
  registered_at: string;
}

interface ReagentLot {
  id: string;
  lot_number: string;
  current_quantity: number;
  location: string;
  expiry_date: string;
  reagents: {
    name: string;
    unit_measure: string;
  };
  manufacturers: {
    name: string;
  };
  criticality_level: string;
}

export default function Scanner() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [scannedData, setScannedData] = useState<ScannedReagent | null>(null);
  const [reagentLot, setReagentLot] = useState<ReagentLot | null>(null);
  const [consumptionData, setConsumptionData] = useState({
    quantityUsed: "",
    notes: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    // Initialize QR code reader
    codeReader.current = new BrowserMultiFormatReader();
    getVideoDevices();
    
    return () => {
      stopScanning();
    };
  }, []);

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoInputDevices);
      if (videoInputDevices.length > 0) {
        setSelectedDeviceId(videoInputDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting video devices:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      if (!codeReader.current) throw new Error('QR code reader not initialized');

      // Create image element for file processing
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = async () => {
        try {
          const result = await codeReader.current!.decodeFromImageUrl(imageUrl);
          await processQRCodeResult(result.getText());
          URL.revokeObjectURL(imageUrl);
        } catch (error) {
          console.error('Error reading QR code from file:', error);
          toast({
            title: "Erro ao ler QR code",
            description: "Não foi possível processar a imagem. Verifique se é um QR code válido.",
            variant: "destructive",
          });
          URL.revokeObjectURL(imageUrl);
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        toast({
          title: "Erro ao carregar imagem",
          description: "Não foi possível carregar a imagem selecionada.",
          variant: "destructive",
        });
        URL.revokeObjectURL(imageUrl);
        setIsProcessing(false);
      };
      
      img.src = imageUrl;

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Tente novamente com uma imagem válida.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const startCameraScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      const deviceId = selectedDeviceId || undefined;
      
      await codeReader.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          processQRCodeResult(result.getText());
          stopScanning();
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Error during scanning:', err);
        }
      });

      toast({
        title: "Scanner iniciado",
        description: "Aponte a câmera para o QR code do reagente.",
      });

    } catch (error) {
      console.error('Error starting camera scan:', error);
      toast({
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const processQRCodeResult = async (qrText: string) => {
    try {
      const qrData = JSON.parse(qrText) as ScannedReagent;
      
      // Buscar dados atualizados do reagente no banco
      const { data: lotData, error } = await supabase
        .from('reagent_lots')
        .select(`
          id,
          lot_number,
          current_quantity,
          location,
          expiry_date,
          reagents (name, unit_measure),
          manufacturers (name),
          criticality_level
        `)
        .eq('id', qrData.id)
        .single();

      if (error) {
        throw new Error('Lote não encontrado no banco de dados');
      }

      setReagentLot(lotData);
      setScannedData({
        ...qrData,
        quantity: lotData.current_quantity, // Usar quantidade atual do banco
      });

      toast({
        title: "QR code lido com sucesso!",
        description: `Reagente identificado: ${lotData.reagents.name}`,
      });

    } catch (error) {
      console.error('Error processing QR code:', error);
      toast({
        title: "QR code inválido",
        description: "Não foi possível processar os dados do QR code.",
        variant: "destructive",
      });
    }
  };


  const registerConsumption = async () => {
    if (!scannedData || !reagentLot || !consumptionData.quantityUsed) {
      toast({
        title: "Dados incompletos",
        description: "Informe a quantidade consumida.",
        variant: "destructive",
      });
      return;
    }

    const quantityUsed = parseFloat(consumptionData.quantityUsed);
    if (quantityUsed > reagentLot.current_quantity) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade consumida não pode ser maior que a disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Registrar log de consumo
      const { error: logError } = await supabase
        .from('consumption_logs')
        .insert({
          reagent_lot_id: reagentLot.id,
          action_type: 'consume',
          quantity_changed: quantityUsed,
          quantity_before: reagentLot.current_quantity,
          quantity_after: reagentLot.current_quantity - quantityUsed,
          notes: consumptionData.notes,
          user_id: profile?.id,
        });

      if (logError) throw logError;

      // Atualizar quantidade no lote
      const { error: updateError } = await supabase
        .from('reagent_lots')
        .update({
          current_quantity: reagentLot.current_quantity - quantityUsed,
        })
        .eq('id', reagentLot.id);

      if (updateError) throw updateError;

      // Registrar no blockchain se for reagente crítico
      if (reagentLot.criticality_level === 'critical') {
        const { error: blockchainError } = await supabase
          .from('blockchain_transactions')
          .insert({
            transaction_hash: `CONSUME_${Date.now()}_${reagentLot.id}`,
            transaction_type: 'consume',
            reagent_lot_id: reagentLot.id,
            data_hash: btoa(JSON.stringify({
              quantity_consumed: quantityUsed,
              user: profile?.full_name,
              notes: consumptionData.notes,
            })),
          });

        if (blockchainError) throw blockchainError;
      }

      toast({
        title: "Consumo registrado com sucesso!",
        description: `${quantityUsed} ${reagentLot.reagents.unit_measure} de ${reagentLot.reagents.name} registrados.`,
      });

      // Atualizar dados locais
      setReagentLot(prev => prev ? {
        ...prev,
        current_quantity: prev.current_quantity - quantityUsed
      } : null);

      setScannedData(prev => prev ? {
        ...prev,
        quantity: prev.quantity - quantityUsed
      } : null);

      // Limpar form
      setConsumptionData({
        quantityUsed: "",
        notes: "",
      });

    } catch (error) {
      console.error('Error registering consumption:', error);
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
    setReagentLot(null);
    setConsumptionData({
      quantityUsed: "",
      notes: "",
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
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
                  {!isScanning ? (
                    <Button onClick={startCameraScanning} className="h-24 flex flex-col gap-2">
                      <Camera className="h-8 w-8" />
                      <span>Usar Câmera</span>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <video 
                          ref={videoRef}
                          className="w-full h-64 object-cover rounded-lg border"
                          autoPlay
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg"></div>
                        </div>
                      </div>
                      <Button onClick={stopScanning} variant="destructive" className="w-full">
                        <StopCircle className="h-4 w-4 mr-2" />
                        Parar Scanner
                      </Button>
                      
                      {devices.length > 1 && (
                        <select 
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          {devices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Câmera ${device.deviceId.slice(0, 8)}...`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
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

                {!isScanning && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Como usar:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use a câmera para leitura direta do QR code</li>
                      <li>• Ou faça upload de uma foto do QR code</li>
                      <li>• O sistema identificará automaticamente o reagente</li>
                    </ul>
                  </div>
                )}
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
                    <h3 className="text-lg font-semibold">{scannedData.reagent_name}</h3>
                    <div className="flex gap-1">
                      {reagentLot?.criticality_level === 'critical' && (
                        <Badge variant="destructive">Crítico</Badge>
                      )}
                      {isExpired(scannedData.expiry_date) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vencido
                        </Badge>
                      )}
                      {isExpiringSoon(scannedData.expiry_date) && !isExpired(scannedData.expiry_date) && (
                        <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          Vencendo
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Lote: {scannedData.lot_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Validade: {new Date(scannedData.expiry_date).toLocaleDateString('pt-BR')}</span>
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
                    value={profile?.full_name || ""}
                    disabled
                    className="bg-muted"
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