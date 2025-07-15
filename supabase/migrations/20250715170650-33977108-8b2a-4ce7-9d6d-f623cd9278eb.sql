-- Inserir alguns lotes de reagentes de exemplo
INSERT INTO public.reagent_lots (reagent_id, lot_number, manufacturer_id, expiry_date, unit_id, location, initial_quantity, current_quantity, minimum_stock, qr_code_data, registered_by) 
SELECT 
    r.id,
    'LOT2024' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    m.id,
    CURRENT_DATE + (30 + (ROW_NUMBER() OVER() * 10)) * INTERVAL '1 day',
    u.id,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'Geladeira A2'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'Prateleira B1'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Armário C3'
        ELSE 'Freezer D1'
    END,
    100,
    75 - (ROW_NUMBER() OVER() * 5),
    20,
    '{"generated": true}',
    (SELECT id FROM auth.users LIMIT 1)
FROM 
    (SELECT id FROM public.reagents LIMIT 5) r
    CROSS JOIN (SELECT id FROM public.manufacturers LIMIT 2) m
    CROSS JOIN (SELECT id FROM public.units LIMIT 2) u;