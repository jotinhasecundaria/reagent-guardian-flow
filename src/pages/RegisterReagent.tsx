import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, QrCode, Download, Printer } from "lucide-react";
import QRCode from "qrcode";

interface ReagentData {
  reagent_id: string;
  lot: string;
  manufacturer_id: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  location: string;
  notes: string;
}

interface Reagent {
  id: string;
  name: string;
  unit_measure: string;
}

interface Manufacturer {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
}

export default function RegisterReagent() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState<ReagentData>({
    reagent_id: "",
    lot: "",
    manufacturer_id: "",
    expiryDate: "",
    quantity: "",
    unit: "ml",
    location: "",
    notes: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch reagents
      const { data: reagentsData } = await supabase
        .from('reagents')
        .select('id, name, unit_measure')
        .eq('is_active', true);
      
      // Fetch manufacturers
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('is_active', true);
      
      // Fetch units
      const { data: unitsData } = await supabase
        .from('units')
        .select('id, name')
        .eq('is_active', true);

      setReagents(reagentsData || []);
      setManufacturers(manufacturersData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof ReagentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateQRCode = async () => {
    if (!formData.reagent_id || !formData.lot || !formData.expiryDate || !formData.quantity || !formData.manufacturer_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de cadastrar.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.unit_id) {
      toast({
        title: "Erro de usuário",
        description: "Usuário não está associado a uma unidade.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Inserir lote no Supabase
      const { data: newLot, error } = await supabase
        .from('reagent_lots')
        .insert({
          reagent_id: formData.reagent_id,
          lot_number: formData.lot,
          manufacturer_id: formData.manufacturer_id,
          expiry_date: formData.expiryDate,
          unit_id: profile.unit_id,
          initial_quantity: parseFloat(formData.quantity),
          current_quantity: parseFloat(formData.quantity),
          minimum_stock: Math.ceil(parseFloat(formData.quantity) * 0.2), // 20% como estoque mínimo
          location: formData.location,
          registered_by: profile.id,
          qr_code_data: {},
          storage_conditions: {},
        })
        .select(`
          id,
          lot_number,
          expiry_date,
          current_quantity,
          location,
          reagents (name, unit_measure),
          manufacturers (name)
        `)
        .single();

      if (error) throw error;

      // Gerar dados para QR code
      const qrData = {
        id: newLot.id,
        reagent_name: newLot.reagents.name,
        lot_number: newLot.lot_number,
        manufacturer: newLot.manufacturers.name,
        expiry_date: newLot.expiry_date,
        quantity: newLot.current_quantity,
        unit: newLot.reagents.unit_measure,
        location: newLot.location,
        registered_at: new Date().toISOString(),
      };

      // Atualizar o QR code data no banco
      await supabase
        .from('reagent_lots')
        .update({ qr_code_data: qrData })
        .eq('id', newLot.id);

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(qrCodeDataUrl);

      toast({
        title: "Reagente cadastrado com sucesso!",
        description: `${newLot.reagents.name} - Lote ${newLot.lot_number} cadastrado e QR code gerado.`,
      });

      // Resetar formulário
      setFormData({
        reagent_id: "",
        lot: "",
        manufacturer_id: "",
        expiryDate: "",
        quantity: "",
        unit: selectedReagent?.unit_measure || "ml",
        location: "",
        notes: "",
      });

    } catch (error) {
      console.error('Error creating reagent lot:', error);
      toast({
        title: "Erro ao cadastrar reagente",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const reagentName = selectedReagent?.name || 'reagente';
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${reagentName}-${formData.lot}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR code baixado",
      description: "O arquivo foi salvo em seus downloads.",
    });
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const reagentName = selectedReagent?.name || 'Reagente';
    const manufacturerName = manufacturers.find(m => m.id === formData.manufacturer_id)?.name || '';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${reagentName}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              .qr-container { border: 1px solid #ccc; padding: 20px; margin: 20px auto; width: fit-content; }
              h2 { margin-bottom: 10px; }
              .details { font-size: 12px; margin-top: 10px; text-align: left; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${reagentName}</h2>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="details">
                <p><strong>Lote:</strong> ${formData.lot}</p>
                <p><strong>Fabricante:</strong> ${manufacturerName}</p>
                <p><strong>Validade:</strong> ${new Date(formData.expiryDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>Quantidade:</strong> ${formData.quantity} ${formData.unit}</p>
                <p><strong>Local:</strong> ${formData.location}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const resetForm = () => {
    setFormData({
      reagent_id: "",
      lot: "",
      manufacturer_id: "",
      expiryDate: "",
      quantity: "",
      unit: selectedReagent?.unit_measure || "ml",
      location: "",
      notes: "",
    });
    setQrCodeUrl("");
    setSelectedReagent(null);
  };

  const handleReagentChange = (reagentId: string) => {
    const reagent = reagents.find(r => r.id === reagentId);
    setSelectedReagent(reagent || null);
    setFormData(prev => ({
      ...prev,
      reagent_id: reagentId,
      unit: reagent?.unit_measure || "ml"
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-primary" />
          Cadastrar Reagente
        </h1>
        <p className="text-muted-foreground">Registre um novo lote de reagente e gere seu QR code</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Reagente</CardTitle>
            <CardDescription>Preencha as informações do lote de reagente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reagent">Reagente *</Label>
                <Select value={formData.reagent_id} onValueChange={handleReagentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o reagente" />
                  </SelectTrigger>
                  <SelectContent>
                    {reagents.map((reagent) => (
                      <SelectItem key={reagent.id} value={reagent.id}>
                        {reagent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot">Número do Lote *</Label>
                <Input
                  id="lot"
                  value={formData.lot}
                  onChange={(e) => handleInputChange("lot", e.target.value)}
                  placeholder="Ex: LOT2024001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante *</Label>
              <Select value={formData.manufacturer_id} onValueChange={(value) => handleInputChange("manufacturer_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Data de Validade *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local de Armazenamento</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Ex: Geladeira A2, Prateleira 3"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Unidade definida pelo reagente selecionado
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Informações adicionais sobre o reagente..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={generateQRCode} disabled={isGenerating} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                {isGenerating ? "Cadastrando..." : "Cadastrar Reagente"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Gerado</CardTitle>
            <CardDescription>
              {qrCodeUrl 
                ? "QR code pronto para impressão e etiquetagem" 
                : "Preencha os campos obrigatórios e clique em 'Cadastrar Reagente'"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code do reagente" 
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Reagente:</strong> {selectedReagent?.name}</p>
                  <p><strong>Lote:</strong> {formData.lot}</p>
                  <p><strong>Validade:</strong> {new Date(formData.expiryDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Quantidade:</strong> {formData.quantity} {formData.unit}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadQRCode} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button onClick={printQRCode} variant="outline" className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                <div className="text-center space-y-2">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">QR code aparecerá aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}