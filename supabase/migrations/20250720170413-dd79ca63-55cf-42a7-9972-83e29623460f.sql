-- Inserir dados iniciais necessários para o funcionamento do sistema

-- Inserir unidades padrão
INSERT INTO public.units (id, name, location, contact_info) VALUES 
('11111111-1111-1111-1111-111111111111', 'Lab Central', 'Prédio Principal - Térreo', '{"phone": "(11) 3333-4444", "email": "central@lab.com"}'),
('22222222-2222-2222-2222-222222222222', 'Lab Norte', 'Prédio Norte - 1º Andar', '{"phone": "(11) 3333-4445", "email": "norte@lab.com"}'),
('33333333-3333-3333-3333-333333333333', 'Lab Sul', 'Prédio Sul - 2º Andar', '{"phone": "(11) 3333-4446", "email": "sul@lab.com"}'),
('44444444-4444-4444-4444-444444444444', 'Lab Oeste', 'Prédio Oeste - Térreo', '{"phone": "(11) 3333-4447", "email": "oeste@lab.com"}')
ON CONFLICT (id) DO NOTHING;

-- Inserir fabricantes padrão
INSERT INTO public.manufacturers (id, name, contact_info) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BioTech Labs', '{"phone": "(11) 2222-3333", "email": "contato@biotech.com", "website": "www.biotech.com"}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DiagCorp', '{"phone": "(11) 2222-3334", "email": "vendas@diagcorp.com", "website": "www.diagcorp.com"}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'LabMax', '{"phone": "(11) 2222-3335", "email": "suporte@labmax.com", "website": "www.labmax.com"}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ReagentPlus', '{"phone": "(11) 2222-3336", "email": "info@reagentplus.com", "website": "www.reagentplus.com"}')
ON CONFLICT (id) DO NOTHING;

-- Inserir reagentes padrão
INSERT INTO public.reagents (id, name, type, description, storage_conditions, unit_measure, minimum_stock) VALUES 
('r1111111-1111-1111-1111-111111111111', 'Glicose Oxidase', 'Enzima', 'Reagente para determinação de glicose sérica', 'Armazenar entre 2-8°C', 'ml', 10),
('r2222222-2222-2222-2222-222222222222', 'Colesterol HDL', 'Reagente Químico', 'Kit para dosagem de colesterol HDL', 'Armazenar em temperatura ambiente', 'ml', 15),
('r3333333-3333-3333-3333-333333333333', 'Triglicerídeos', 'Reagente Químico', 'Reagente para dosagem de triglicerídeos', 'Armazenar entre 15-25°C', 'ml', 20),
('r4444444-4444-4444-4444-444444444444', 'Creatinina', 'Reagente Químico', 'Kit para dosagem de creatinina sérica', 'Armazenar entre 2-8°C', 'ml', 8),
('r5555555-5555-5555-5555-555555555555', 'Ureia', 'Reagente Químico', 'Reagente para dosagem de ureia', 'Armazenar em temperatura ambiente', 'ml', 12),
('r6666666-6666-6666-6666-666666666666', 'ALT/TGP', 'Enzima', 'Reagente para dosagem de alanina aminotransferase', 'Armazenar entre 2-8°C', 'ml', 5)
ON CONFLICT (id) DO NOTHING;

-- Inserir tipos de exame padrão
INSERT INTO public.exam_types (id, name, description, required_reagents) VALUES 
('e1111111-1111-1111-1111-111111111111', 'Glicemia de Jejum', 'Dosagem de glicose sérica em jejum', '[{"reagent_id": "r1111111-1111-1111-1111-111111111111", "reagent_name": "Glicose Oxidase", "quantity": 2}]'),
('e2222222-2222-2222-2222-222222222222', 'Perfil Lipídico', 'Dosagem de colesterol total, HDL e triglicerídeos', '[{"reagent_id": "r2222222-2222-2222-2222-222222222222", "reagent_name": "Colesterol HDL", "quantity": 1}, {"reagent_id": "r3333333-3333-3333-3333-333333333333", "reagent_name": "Triglicerídeos", "quantity": 1}]'),
('e3333333-3333-3333-3333-333333333333', 'Função Renal', 'Dosagem de creatinina e ureia', '[{"reagent_id": "r4444444-4444-4444-4444-444444444444", "reagent_name": "Creatinina", "quantity": 1}, {"reagent_id": "r5555555-5555-5555-5555-555555555555", "reagent_name": "Ureia", "quantity": 1}]'),
('e4444444-4444-4444-4444-444444444444', 'Função Hepática', 'Dosagem de enzimas hepáticas', '[{"reagent_id": "r6666666-6666-6666-6666-666666666666", "reagent_name": "ALT/TGP", "quantity": 2}]')
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns lotes de reagentes de exemplo
INSERT INTO public.reagent_lots (id, reagent_id, lot_number, manufacturer_id, expiry_date, unit_id, initial_quantity, current_quantity, minimum_stock, location, criticality_level, status) VALUES 
('l1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'LOT2024001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-12-15', '11111111-1111-1111-1111-111111111111', 100, 75, 20, 'Geladeira A2', 'normal', 'active'),
('l2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 'LOT2024002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-11-30', '22222222-2222-2222-2222-222222222222', 50, 8, 15, 'Prateleira B1', 'normal', 'active'),
('l3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 'LOT2024003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-01-20', '33333333-3333-3333-3333-333333333333', 80, 65, 25, 'Geladeira C1', 'normal', 'active'),
('l4444444-4444-4444-4444-444444444444', 'r4444444-4444-4444-4444-444444444444', 'LOT2024004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-10-15', '11111111-1111-1111-1111-111111111111', 30, 5, 10, 'Armário D3', 'critical', 'active'),
('l5555555-5555-5555-5555-555555555555', 'r5555555-5555-5555-5555-555555555555', 'LOT2024005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-03-10', '22222222-2222-2222-2222-222222222222', 60, 45, 12, 'Prateleira E2', 'normal', 'active'),
('l6666666-6666-6666-6666-666666666666', 'r6666666-6666-6666-6666-666666666666', 'LOT2024006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-09-30', '33333333-3333-3333-3333-333333333333', 25, 3, 5, 'Geladeira F1', 'critical', 'active')
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir que todos os usuários vejam reagents
CREATE POLICY IF NOT EXISTS "Users can insert reagents" ON public.reagents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update reagents" ON public.reagents FOR UPDATE TO authenticated USING (true);

-- Criar política para permitir que todos os usuários vejam manufacturers
CREATE POLICY IF NOT EXISTS "Users can insert manufacturers" ON public.manufacturers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update manufacturers" ON public.manufacturers FOR UPDATE TO authenticated USING (true);

-- Criar política para permitir que todos os usuários vejam exam_types
CREATE POLICY IF NOT EXISTS "Users can insert exam_types" ON public.exam_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update exam_types" ON public.exam_types FOR UPDATE TO authenticated USING (true);

-- Criar política para permitir que todos os usuários vejam units
CREATE POLICY IF NOT EXISTS "Users can insert units" ON public.units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update units" ON public.units FOR UPDATE TO authenticated USING (true);

-- Criar políticas para appointments
CREATE POLICY IF NOT EXISTS "Users can insert appointments in their unit" ON public.appointments FOR INSERT TO authenticated WITH CHECK ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text));
CREATE POLICY IF NOT EXISTS "Users can update appointments in their unit" ON public.appointments FOR UPDATE TO authenticated USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text));
CREATE POLICY IF NOT EXISTS "Users can delete appointments in their unit" ON public.appointments FOR DELETE TO authenticated USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text));

-- Criar políticas para consumption_logs
CREATE POLICY IF NOT EXISTS "Users can insert consumption logs in their unit" ON public.consumption_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = consumption_logs.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));
CREATE POLICY IF NOT EXISTS "Users can update consumption logs in their unit" ON public.consumption_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = consumption_logs.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));

-- Criar políticas para reagent_reservations
CREATE POLICY IF NOT EXISTS "Users can insert reservations in their unit" ON public.reagent_reservations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = reagent_reservations.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));
CREATE POLICY IF NOT EXISTS "Users can update reservations in their unit" ON public.reagent_reservations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = reagent_reservations.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));
CREATE POLICY IF NOT EXISTS "Users can delete reservations in their unit" ON public.reagent_reservations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = reagent_reservations.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));

-- Criar políticas para quality_controls  
CREATE POLICY IF NOT EXISTS "Users can delete quality controls in their unit" ON public.quality_controls FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = quality_controls.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));

-- Criar políticas para blockchain_transactions
CREATE POLICY IF NOT EXISTS "Users can insert blockchain transactions for their unit" ON public.blockchain_transactions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = blockchain_transactions.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));
CREATE POLICY IF NOT EXISTS "Users can update blockchain transactions for their unit" ON public.blockchain_transactions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = blockchain_transactions.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));
CREATE POLICY IF NOT EXISTS "Users can delete blockchain transactions for their unit" ON public.blockchain_transactions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM reagent_lots rl WHERE rl.id = blockchain_transactions.reagent_lot_id AND ((rl.unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text))));

-- Criar políticas para intelligent_alerts
CREATE POLICY IF NOT EXISTS "Users can insert alerts for their unit" ON public.intelligent_alerts FOR INSERT TO authenticated WITH CHECK ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text));
CREATE POLICY IF NOT EXISTS "Users can delete alerts for their unit" ON public.intelligent_alerts FOR DELETE TO authenticated USING ((unit_id = get_current_user_unit()) OR (get_current_user_role() = 'admin'::text));

-- Habilitar realtime para tabelas importantes
ALTER TABLE public.reagent_lots REPLICA IDENTITY FULL;
ALTER TABLE public.consumption_logs REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.reagent_reservations REPLICA IDENTITY FULL;
ALTER TABLE public.intelligent_alerts REPLICA IDENTITY FULL;

-- Adicionar tabelas ao realtime
ALTER publication supabase_realtime ADD TABLE public.reagent_lots;
ALTER publication supabase_realtime ADD TABLE public.consumption_logs;
ALTER publication supabase_realtime ADD TABLE public.appointments;
ALTER publication supabase_realtime ADD TABLE public.reagent_reservations;
ALTER publication supabase_realtime ADD TABLE public.intelligent_alerts;