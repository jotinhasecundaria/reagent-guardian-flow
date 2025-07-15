-- Sistema completo de gestão de reagentes

-- 1. ESTRUTURA ORGANIZACIONAL
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  contact_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFIS DE USUÁRIOS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'auditor')),
  unit_id UUID REFERENCES public.units(id),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GESTÃO DE REAGENTES
CREATE TABLE public.reagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  storage_conditions TEXT,
  minimum_stock INTEGER DEFAULT 0,
  unit_measure TEXT NOT NULL DEFAULT 'ml',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reagent_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reagent_id UUID NOT NULL REFERENCES public.reagents(id),
  lot_number TEXT NOT NULL,
  manufacturer_id UUID REFERENCES public.manufacturers(id),
  expiry_date DATE NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  location TEXT,
  initial_quantity DECIMAL(10,2) NOT NULL,
  current_quantity DECIMAL(10,2) NOT NULL,
  reserved_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_stock DECIMAL(10,2) DEFAULT 0,
  qr_code_data JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'finished', 'blocked')),
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lot_number, manufacturer_id)
);

-- 4. TIPOS DE EXAMES E AGENDAMENTOS
CREATE TABLE public.exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  required_reagents JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID REFERENCES public.exam_types(id),
  patient_name TEXT,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESERVAS DE REAGENTES
CREATE TABLE public.reagent_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reagent_lot_id UUID NOT NULL REFERENCES public.reagent_lots(id),
  appointment_id UUID REFERENCES public.appointments(id),
  quantity_reserved DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LOGS DE CONSUMO E MOVIMENTAÇÕES
CREATE TABLE public.consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reagent_lot_id UUID NOT NULL REFERENCES public.reagent_lots(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('consumption', 'registration', 'reservation', 'adjustment', 'return', 'expiry')),
  quantity_before DECIMAL(10,2) NOT NULL,
  quantity_after DECIMAL(10,2) NOT NULL,
  quantity_changed DECIMAL(10,2) NOT NULL,
  notes TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CACHE OFFLINE E QR HISTORY
CREATE TABLE public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE public.qr_print_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reagent_lot_id UUID REFERENCES public.reagent_lots(id),
  printed_by UUID REFERENCES auth.users(id),
  print_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INSERIR DADOS INICIAIS
INSERT INTO public.units (name, location) VALUES 
('Lab Central', 'Prédio A - Térreo'),
('Lab Norte', 'Prédio B - 2º Andar'),
('Lab Sul', 'Prédio C - 1º Andar'),
('Lab Oeste', 'Prédio D - Térreo');

INSERT INTO public.manufacturers (name, contact_info) VALUES 
('BioTech Labs', '{"email": "contato@biotechlabs.com", "phone": "+55 11 1234-5678"}'),
('DiagCorp', '{"email": "vendas@diagcorp.com", "phone": "+55 11 9876-5432"}'),
('LabMax', '{"email": "suporte@labmax.com", "phone": "+55 11 5555-7777"}'),
('ReagentPlus', '{"email": "info@reagentplus.com", "phone": "+55 11 3333-9999"}');

INSERT INTO public.reagents (name, type, storage_conditions, minimum_stock, unit_measure) VALUES 
('Glicose Oxidase', 'Enzima', 'Refrigeração 2-8°C', 20, 'ml'),
('Colesterol HDL', 'Reagente Químico', 'Temperatura ambiente', 15, 'ml'),
('Triglicerídeos', 'Reagente Químico', 'Refrigeração 2-8°C', 25, 'ml'),
('Creatinina', 'Reagente Químico', 'Temperatura ambiente', 10, 'ml'),
('Hemoglobina Glicada', 'Kit Diagnóstico', 'Refrigeração 2-8°C', 5, 'unidades');

INSERT INTO public.exam_types (name, description, required_reagents) VALUES 
('Glicemia', 'Exame de glicose no sangue', '[{"reagent_name": "Glicose Oxidase", "quantity": 2}]'),
('Perfil Lipídico', 'Análise de colesterol e triglicerídeos', '[{"reagent_name": "Colesterol HDL", "quantity": 1}, {"reagent_name": "Triglicerídeos", "quantity": 1}]'),
('Função Renal', 'Avaliação da função dos rins', '[{"reagent_name": "Creatinina", "quantity": 3}]'),
('Hemoglobina Glicada', 'Controle do diabetes', '[{"reagent_name": "Hemoglobina Glicada", "quantity": 1}]');

-- 9. TRIGGERS PARA TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reagents_updated_at BEFORE UPDATE ON public.reagents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reagent_lots_updated_at BEFORE UPDATE ON public.reagent_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, unit_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        'technician',
        (SELECT id FROM public.units LIMIT 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. FUNÇÕES HELPER
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_unit()
RETURNS UUID AS $$
    SELECT unit_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.calculate_stock_status(lot_id UUID)
RETURNS TEXT AS $$
DECLARE
    lot_record RECORD;
    days_until_expiry INTEGER;
BEGIN
    SELECT current_quantity, minimum_stock, expiry_date 
    INTO lot_record 
    FROM public.reagent_lots 
    WHERE id = lot_id;
    
    IF NOT FOUND THEN
        RETURN 'unknown';
    END IF;
    
    days_until_expiry := (lot_record.expiry_date - CURRENT_DATE);
    
    -- Vencido
    IF days_until_expiry < 0 THEN
        RETURN 'expired';
    END IF;
    
    -- Crítico (abaixo do mínimo ou vence em 7 dias)
    IF lot_record.current_quantity <= lot_record.minimum_stock OR days_until_expiry <= 7 THEN
        RETURN 'critical';
    END IF;
    
    -- Baixo (vence em 30 dias)
    IF days_until_expiry <= 30 THEN
        RETURN 'low';
    END IF;
    
    RETURN 'normal';
END;
$$ LANGUAGE plpgsql;

-- 12. RLS POLICIES
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reagent_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reagent_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_print_history ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuários veem dados de suas unidades, admins veem tudo)
CREATE POLICY "Allow read access" ON public.units FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.manufacturers FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.exam_types FOR SELECT USING (true);

CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users see reagents" ON public.reagents FOR SELECT USING (true);

CREATE POLICY "Users see unit reagent lots" ON public.reagent_lots 
FOR SELECT USING (
    unit_id = public.get_current_user_unit() OR
    public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can insert reagent lots in their unit" ON public.reagent_lots 
FOR INSERT WITH CHECK (
    unit_id = public.get_current_user_unit() OR
    public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can update reagent lots in their unit" ON public.reagent_lots 
FOR UPDATE USING (
    unit_id = public.get_current_user_unit() OR
    public.get_current_user_role() = 'admin'
);

-- Políticas similares para outras tabelas
CREATE POLICY "Users see unit appointments" ON public.appointments 
FOR SELECT USING (
    unit_id = public.get_current_user_unit() OR
    public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users see unit reservations" ON public.reagent_reservations 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.reagent_lots rl 
        WHERE rl.id = reagent_lot_id 
        AND (rl.unit_id = public.get_current_user_unit() OR public.get_current_user_role() = 'admin')
    )
);

CREATE POLICY "Users see unit logs" ON public.consumption_logs 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.reagent_lots rl 
        WHERE rl.id = reagent_lot_id 
        AND (rl.unit_id = public.get_current_user_unit() OR public.get_current_user_role() = 'admin')
    )
);

CREATE POLICY "Users manage own sync queue" ON public.offline_sync_queue 
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own print history" ON public.qr_print_history 
FOR ALL USING (printed_by = auth.uid());