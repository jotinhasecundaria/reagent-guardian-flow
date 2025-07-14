import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, QrCode, Download, Printer } from "lucide-react";
import QRCode from "qrcode";

interface ReagentData {
  name: string;
  lot: string;
  manufacturer: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  location: string;
  notes: string;
}

export default function RegisterReagent() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ReagentData>({
    name: "",
    lot: "",
    manufacturer: "",
    expiryDate: "",
    quantity: "",
    unit: "ml",
    location: "",
    notes: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof ReagentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateQRCode = async () => {
    if (!formData.name || !formData.lot || !formData.expiryDate || !formData.quantity) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de gerar o QR code.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simular ID único que viria do Supabase
      const mockId = Date.now().toString();
      
      const qrData = {
        id: mockId,
        name: formData.name,
        lot: formData.lot,
        manufacturer: formData.manufacturer,
        expiryDate: formData.expiryDate,
        quantity: formData.quantity,
        unit: formData.unit,
        location: formData.location,
        registeredAt: new Date().toISOString(),
      };

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
        description: `QR code gerado para ${formData.name} - Lote ${formData.lot}`,
      });

      // Em produção, aqui faria a chamada para o Supabase
      console.log("Dados que seriam salvos no Supabase:", qrData);

    } catch (error) {
      toast({
        title: "Erro ao gerar QR code",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${formData.name}-${formData.lot}.png`;
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

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${formData.name}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              .qr-container { border: 1px solid #ccc; padding: 20px; margin: 20px auto; width: fit-content; }
              h2 { margin-bottom: 10px; }
              .details { font-size: 12px; margin-top: 10px; text-align: left; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${formData.name}</h2>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="details">
                <p><strong>Lote:</strong> ${formData.lot}</p>
                <p><strong>Fabricante:</strong> ${formData.manufacturer}</p>
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
      name: "",
      lot: "",
      manufacturer: "",
      expiryDate: "",
      quantity: "",
      unit: "ml",
      location: "",
      notes: "",
    });
    setQrCodeUrl("");
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
                <Label htmlFor="name">Nome do Reagente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Glicose Oxidase"
                />
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
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                placeholder="Nome do fabricante"
              />
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
                <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="unidades">unidades</SelectItem>
                  </SelectContent>
                </Select>
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
                {isGenerating ? "Gerando..." : "Gerar QR Code"}
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
                : "Preencha os campos obrigatórios e clique em 'Gerar QR Code'"
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
                  <p><strong>Nome:</strong> {formData.name}</p>
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