
-- Criação de tabelas para as novas funcionalidades do sistema

-- Tabela para armazenar dados de IoT dos sensores
CREATE TABLE public.iot_sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) NOT NULL,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'pressure', 'motion')),
    location TEXT NOT NULL,
    device_id TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_reading JSONB,
    last_reading_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para leituras dos sensores IoT
CREATE TABLE public.iot_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES public.iot_sensors(id) NOT NULL,
    value NUMERIC NOT NULL,
    unit_measure TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB
);

-- Tabela para gamificação e pontuação dos usuários
CREATE TABLE public.user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    total_points INTEGER DEFAULT 0,
    level_name TEXT DEFAULT 'Iniciante',
    achievements JSONB DEFAULT '[]'::jsonb,
    streaks JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Tabela para alertas e notificações inteligentes
CREATE TABLE public.intelligent_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('expiry_prediction', 'stock_critical', 'temperature_alert', 'quality_issue', 'transfer_needed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para previsões de demanda baseadas em IA
CREATE TABLE public.demand_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reagent_id UUID REFERENCES public.reagents(id) NOT NULL,
    unit_id UUID REFERENCES public.units(id) NOT NULL,
    predicted_consumption NUMERIC NOT NULL,
    prediction_period TEXT NOT NULL CHECK (prediction_period IN ('daily', 'weekly', 'monthly')),
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    factors JSONB,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para rastreabilidade blockchain (simulada)
CREATE TABLE public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('register', 'transfer', 'consume', 'dispose')),
    reagent_lot_id UUID REFERENCES public.reagent_lots(id),
    data_hash TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    gas_used NUMERIC,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Tabela para sugestões inteligentes de localização
CREATE TABLE public.location_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) NOT NULL,
    reagent_type TEXT,
    suggested_location TEXT NOT NULL,
    reasoning TEXT,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    environmental_conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para controle de qualidade avançado
CREATE TABLE public.quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reagent_lot_id UUID REFERENCES public.reagent_lots(id) NOT NULL,
    test_type TEXT NOT NULL,
    test_result TEXT CHECK (test_result IN ('passed', 'failed', 'pending')),
    test_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tested_by UUID REFERENCES public.profiles(id),
    parameters JSONB,
    observations TEXT,
    next_test_due TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.iot_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_controls ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para iot_sensors
CREATE POLICY "Users see unit IoT sensors" ON public.iot_sensors
FOR SELECT USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'));

-- Políticas RLS para iot_readings
CREATE POLICY "Users see unit IoT readings" ON public.iot_readings
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.iot_sensors s 
    WHERE s.id = iot_readings.sensor_id 
    AND ((s.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'))
));

-- Políticas RLS para user_gamification
CREATE POLICY "Users see own gamification" ON public.user_gamification
FOR ALL USING (user_id = auth.uid());

-- Políticas RLS para intelligent_alerts
CREATE POLICY "Users see unit alerts" ON public.intelligent_alerts
FOR SELECT USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'));

CREATE POLICY "Users can resolve unit alerts" ON public.intelligent_alerts
FOR UPDATE USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'));

-- Políticas RLS para demand_predictions
CREATE POLICY "Users see unit predictions" ON public.demand_predictions
FOR SELECT USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'));

-- Políticas RLS para blockchain_transactions
CREATE POLICY "Users see reagent blockchain data" ON public.blockchain_transactions
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.reagent_lots rl 
    WHERE rl.id = blockchain_transactions.reagent_lot_id 
    AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'))
));

-- Políticas RLS para location_suggestions
CREATE POLICY "Users see unit location suggestions" ON public.location_suggestions
FOR SELECT USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'));

-- Políticas RLS para quality_controls
CREATE POLICY "Users see unit quality controls" ON public.quality_controls
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.reagent_lots rl 
    WHERE rl.id = quality_controls.reagent_lot_id 
    AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'))
));

CREATE POLICY "Users can manage unit quality controls" ON public.quality_controls
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.reagent_lots rl 
    WHERE rl.id = quality_controls.reagent_lot_id 
    AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'))
));

-- Adicionando campos para as melhorias nas tabelas existentes
ALTER TABLE public.reagent_lots ADD COLUMN IF NOT EXISTS criticality_level TEXT DEFAULT 'normal' CHECK (criticality_level IN ('low', 'normal', 'high', 'critical'));
ALTER TABLE public.reagent_lots ADD COLUMN IF NOT EXISTS storage_conditions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.reagent_lots ADD COLUMN IF NOT EXISTS quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE public.reagent_lots ADD COLUMN IF NOT EXISTS ai_recommended_location TEXT;
ALTER TABLE public.reagent_lots ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;

-- Atualizar tabela de logs de consumo para incluir gamificação
ALTER TABLE public.consumption_logs ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.consumption_logs ADD COLUMN IF NOT EXISTS sustainability_impact TEXT;

-- Função para calcular pontos de gamificação
CREATE OR REPLACE FUNCTION public.calculate_gamification_points(
    action_type TEXT,
    reagent_criticality TEXT DEFAULT 'normal',
    sustainability_factor NUMERIC DEFAULT 1.0
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_points INTEGER := 10;
    multiplier NUMERIC := 1.0;
BEGIN
    -- Multiplicador baseado na criticidade
    CASE reagent_criticality
        WHEN 'critical' THEN multiplier := multiplier * 2.0;
        WHEN 'high' THEN multiplier := multiplier * 1.5;
        WHEN 'normal' THEN multiplier := multiplier * 1.0;
        ELSE multiplier := multiplier * 0.8;
    END CASE;
    
    -- Multiplicador baseado no tipo de ação
    CASE action_type
        WHEN 'register' THEN base_points := 15;
        WHEN 'consume' THEN base_points := 10;
        WHEN 'transfer' THEN base_points := 12;
        WHEN 'quality_check' THEN base_points := 20;
        ELSE base_points := 5;
    END CASE;
    
    -- Aplicar fator de sustentabilidade
    multiplier := multiplier * sustainability_factor;
    
    RETURN ROUND(base_points * multiplier);
END;
$$;

-- Função para gerar previsões de demanda (simulada)
CREATE OR REPLACE FUNCTION public.generate_demand_prediction(
    p_reagent_id UUID,
    p_unit_id UUID,
    p_period TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    avg_consumption NUMERIC;
    prediction_value NUMERIC;
    confidence NUMERIC;
BEGIN
    -- Calcular média de consumo dos últimos períodos
    SELECT AVG(quantity_changed) INTO avg_consumption
    FROM public.consumption_logs cl
    JOIN public.reagent_lots rl ON rl.id = cl.reagent_lot_id
    WHERE rl.reagent_id = p_reagent_id 
    AND rl.unit_id = p_unit_id
    AND cl.created_at >= now() - INTERVAL '30 days';
    
    -- Se não houver dados históricos, usar valor padrão
    IF avg_consumption IS NULL THEN
        avg_consumption := 10;
        confidence := 0.3;
    ELSE
        confidence := 0.8;
    END IF;
    
    -- Calcular previsão baseada no período
    CASE p_period
        WHEN 'daily' THEN prediction_value := avg_consumption / 30;
        WHEN 'weekly' THEN prediction_value := avg_consumption / 4;
        WHEN 'monthly' THEN prediction_value := avg_consumption;
        ELSE prediction_value := avg_consumption;
    END CASE;
    
    -- Inserir previsão
    INSERT INTO public.demand_predictions (
        reagent_id, unit_id, predicted_consumption, 
        prediction_period, confidence_score, 
        valid_until, factors
    ) VALUES (
        p_reagent_id, p_unit_id, prediction_value,
        p_period, confidence,
        now() + INTERVAL '7 days',
        jsonb_build_object('historical_avg', avg_consumption, 'method', 'simple_average')
    );
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_iot_sensors_updated_at
    BEFORE UPDATE ON public.iot_sensors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
    BEFORE UPDATE ON public.user_gamification
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais de exemplo
INSERT INTO public.user_gamification (user_id, total_points, level_name)
SELECT id, 0, 'Iniciante' 
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Inserir alguns sensores IoT de exemplo
INSERT INTO public.iot_sensors (unit_id, sensor_type, location, device_id) 
SELECT 
    id,
    CASE WHEN random() < 0.5 THEN 'temperature' ELSE 'humidity' END,
    CASE 
        WHEN random() < 0.25 THEN 'Geladeira A2'
        WHEN random() < 0.5 THEN 'Freezer D1'
        WHEN random() < 0.75 THEN 'Sala de Reagentes'
        ELSE 'Almoxarifado'
    END,
    'SENSOR_' || UPPER(substring(md5(random()::text), 1, 8))
FROM public.units;
