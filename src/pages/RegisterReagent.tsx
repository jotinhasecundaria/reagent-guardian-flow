import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FlaskConical,
  Package,
  Building,
  Calendar,
  MapPin,
  Save,
  QrCode,
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [formData, setFormData] = useState({
    reagent_id: "",
    manufacturer_id: "",
    unit_id: profile?.unit_id || "",
    lot_number: "",
    initial_quantity: "",
    minimum_stock: "",
    expiry_date: "",
    location: "",
    storage_conditions: "",
    criticality_level: "normal",
  });

  useEffect(() => {
    loadSelectOptions();
  }, [profile]);

  const loadSelectOptions = async () => {
    try {
      // Carregar reagentes
      const { data: reagentsData } = await supabase
        .from('reagents')
        .select('id, name, unit_measure')
        .eq('is_active', true)
        .order('name');

      // Carregar fabricantes
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      // Carregar unidades
      const { data: unitsData } = await supabase
        .from('units')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (reagentsData) setReagents(reagentsData);
      if (manufacturersData) setManufacturers(manufacturersData);
      if (unitsData) setUnits(unitsData);

    } catch (error) {
      console.error('Error loading select options:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as opções de seleção.",
        variant: "destructive",
      });
    }
  };

  const generateQRCodeData = (lotData: any) => {
    return {
      id: lotData.id,
      lot_number: lotData.lot_number,
      reagent_name: reagents.find(r => r.id === lotData.reagent_id)?.name,
      manufacturer: manufacturers.find(m => m.id === lotData.manufacturer_id)?.name,
      expiry_date: lotData.expiry_date,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações
      if (!formData.reagent_id || !formData.lot_number || !formData.initial_quantity) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (parseFloat(formData.initial_quantity) <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "A quantidade inicial deve ser maior que zero.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o lote já existe
      const { data: existingLot } = await supabase
        .from('reagent_lots')
        .select('id')
        .eq('lot_number', formData.lot_number)
        .eq('reagent_id', formData.reagent_id)
        .single();

      if (existingLot) {
        toast({
          title: "Lote já existe",
          description: "Este número de lote já foi cadastrado para este reagente.",
          variant: "destructive",
        });
        return;
      }

      // Inserir novo lote
      const { data: newLot, error } = await supabase
        .from('reagent_lots')
        .insert({
          reagent_id: formData.reagent_id,
          manufacturer_id: formData.manufacturer_id || null,
          unit_id: formData.unit_id,
          lot_number: formData.lot_number,
          initial_quantity: parseFloat(formData.initial_quantity),
          current_quantity: parseFloat(formData.initial_quantity),
          minimum_stock: parseFloat(formData.minimum_stock) || 0,
          expiry_date: formData.expiry_date,
          location: formData.location || null,
          criticality_level: formData.criticality_level,
          storage_conditions: formData.storage_conditions ? 
            { conditions: formData.storage_conditions } : {},
          registered_by: profile?.id,
          qr_code_data: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Gerar dados do QR code
      const qrData = generateQRCodeData(newLot);
      
      // Atualizar com dados do QR code
      await supabase
        .from('reagent_lots')
        .update({ qr_code_data: qrData })
        .eq('id', newLot.id);

      toast({
        title: "Reagente cadastrado com sucesso!",
        description: `Lote ${formData.lot_number} foi registrado no sistema.`,
      });

      // Limpar formulário
      setFormData({
        reagent_id: "",
        manufacturer_id: "",
        unit_id: profile?.unit_id || "",
        lot_number: "",
        initial_quantity: "",
        minimum_stock: "",
        expiry_date: "",
        location: "",
        storage_conditions: "",
        criticality_level: "normal",
      });

    } catch (error) {
      console.error('Error registering reagent:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o reagente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedReagent = reagents.find(r => r.id === formData.reagent_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-primary" />
          Cadastrar Reagente
        </h1>
        <p className="text-muted-foreground">Registrar novo lote de reagente no sistema</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Lote
          </CardTitle>
          <CardDescription>
            Preencha as informações do novo lote de reagente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            {/* Reagente */}
            <div className="space-y-2">
              <Label htmlFor="reagent">Reagente *</Label>
              <Select value={formData.reagent_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, reagent_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o reagente" />
                </SelectTrigger>
                <SelectContent>
                  {reagents.map((reagent) => (
                    <SelectItem key={reagent.id} value={reagent.id}>
                      {reagent.name} ({reagent.unit_measure})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fabricante */}
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Select value={formData.manufacturer_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, manufacturer_id: value }))
              }>
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

            {/* Unidade */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={formData.unit_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, unit_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número do Lote */}
            <div className="space-y-2">
              <Label htmlFor="lot_number">Número do Lote *</Label>
              <Input
                id="lot_number"
                value={formData.lot_number}
                onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                placeholder="Ex: LOT2024001"
                required
              />
            </div>

            {/* Quantidade Inicial */}
            <div className="space-y-2">
              <Label htmlFor="initial_quantity">
                Quantidade Inicial * {selectedReagent && `(${selectedReagent.unit_measure})`}
              </Label>
              <Input
                id="initial_quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.initial_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_quantity: e.target.value }))}
                placeholder="1000"
                required
              />
            </div>

            {/* Estoque Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="minimum_stock">
                Estoque Mínimo {selectedReagent && `(${selectedReagent.unit_measure})`}
              </Label>
              <Input
                id="minimum_stock"
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: e.target.value }))}
                placeholder="50"
              />
            </div>

            {/* Data de Validade */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Data de Validade *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Geladeira A - Prateleira 2"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Nível de Criticidade */}
            <div className="space-y-2">
              <Label htmlFor="criticality">Nível de Criticidade</Label>
              <Select value={formData.criticality_level} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, criticality_level: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condições de Armazenamento */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="storage_conditions">Condições de Armazenamento</Label>
              <Textarea
                id="storage_conditions"
                value={formData.storage_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, storage_conditions: e.target.value }))}
                placeholder="Ex: Manter entre 2-8°C, proteger da luz"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>Cadastrando...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Cadastrar Reagente
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline" className="flex-shrink-0">
                <QrCode className="h-4 w-4 mr-2" />
                Gerar QR Code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}