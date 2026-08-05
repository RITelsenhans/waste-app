insert into address (id, tenant_id, street, house_number, postal_code, city, district, display_label, service_area_id)
values
    ('demo-musterstrasse-12', 'demo', 'Musterstraße', '12', '52062', 'Demo-Stadt', 'Zentrum', 'Musterstraße 12, 52062 Demo-Stadt', 'demo-zentrum'),
    ('demo-parkweg-7', 'demo', 'Parkweg', '7', '52066', 'Demo-Stadt', 'Süd', 'Parkweg 7, 52066 Demo-Stadt', 'demo-sued'),
    ('demo-ringstrasse-24', 'demo', 'Ringstraße', '24', '52070', 'Demo-Stadt', 'Nord', 'Ringstraße 24, 52070 Demo-Stadt', 'demo-nord');

insert into collection_event (id, tenant_id, address_id, waste_type_id, waste_type_label, planned_date, effective_date, status, last_modified)
values
    ('collection-rest-2026-08-04', 'demo', 'demo-musterstrasse-12', 'residual', 'Restabfall', date '2026-08-04', date '2026-08-04', 'planned', current_timestamp),
    ('collection-bio-2026-08-07', 'demo', 'demo-musterstrasse-12', 'organic', 'Bioabfall', date '2026-08-07', date '2026-08-07', 'planned', current_timestamp),
    ('collection-paper-2026-08-10', 'demo', 'demo-musterstrasse-12', 'paper', 'Papier', date '2026-08-10', date '2026-08-11', 'moved', current_timestamp),
    ('collection-yellow-2026-08-14', 'demo', 'demo-musterstrasse-12', 'packaging', 'Leichtverpackungen', date '2026-08-14', date '2026-08-14', 'planned', current_timestamp),
    ('collection-park-rest-2026-08-05', 'demo', 'demo-parkweg-7', 'residual', 'Restabfall', date '2026-08-05', date '2026-08-05', 'planned', current_timestamp);

insert into waste_guide_entry (id, tenant_id, name, category, disposal_route, notes, synonyms, data_status)
values
    ('guide-batteries', 'demo', 'Batterien', 'Problemstoffe', 'Kostenlos im Handel oder am Recyclinghof abgeben.', 'Nicht in den Restabfall werfen.', 'Akku|Akkus|Knopfzelle|Batterie', current_timestamp),
    ('guide-electronics', 'demo', 'Elektrogeräte', 'Elektroschrott', 'Am Recyclinghof oder über die Rücknahme des Handels entsorgen.', 'Batterien nach Möglichkeit vorher entfernen.', 'Elektroschrott|Fernseher|Toaster|Handy', current_timestamp),
    ('guide-green', 'demo', 'Grünschnitt', 'Gartenabfälle', 'Zur Grünannahme bringen oder Biotonne gemäß örtlicher Regel nutzen.', 'Keine Plastiksäcke mit abgeben.', 'Äste|Laub|Rasenschnitt|Gartenabfall', current_timestamp),
    ('guide-glass', 'demo', 'Altglas', 'Verpackungsglas', 'Nach Farben getrennt in Depotcontainer einwerfen.', 'Keramik und Fensterglas gehören nicht hinein.', 'Flasche|Marmeladenglas|Verpackungsglas', current_timestamp);

insert into disposal_site (id, tenant_id, name, site_type, address, opening_hours, accepted_waste_types, open_now, data_status)
values
    ('site-north', 'demo', 'Recyclinghof Nord', 'Wertstoffhof', 'Ringstraße 80, 52070 Demo-Stadt', 'Mo–Fr 08:00–18:00, Sa 08:00–14:00', 'Batterien|Elektrogeräte|Grünschnitt|Papier|Metall', true, current_timestamp),
    ('site-park', 'demo', 'Sammelstelle am Park', 'Sammelstelle', 'Parkallee 4, 52066 Demo-Stadt', 'Mo–Fr 09:00–17:00', 'Grünschnitt|Papier', true, current_timestamp),
    ('site-glass', 'demo', 'Depotcontainer Markt', 'Depotcontainer', 'Marktplatz, 52062 Demo-Stadt', 'Einwurf werktags 07:00–20:00', 'Altglas|Papier', false, current_timestamp);

insert into notice (id, tenant_id, address_id, notice_type, title, body, priority, valid_from, valid_until)
values
    ('notice-paper-moved', 'demo', 'demo-musterstrasse-12', 'collection-change', 'Papierabholung verschoben', 'Die Papierabholung findet ausnahmsweise am Dienstag, 11. August statt.', 'warning', timestamp with time zone '2026-07-31 00:00:00+00', timestamp with time zone '2026-08-12 23:59:59+00'),
    ('notice-recycling-hours', 'demo', null, 'site-change', 'Sommeröffnungszeiten am Recyclinghof', 'Der Recyclinghof Nord schließt freitags im August erst um 18:00 Uhr.', 'info', timestamp with time zone '2026-07-01 00:00:00+00', timestamp with time zone '2026-08-31 23:59:59+00');

insert into bulk_waste_item_rule (id, tenant_id, label, max_quantity)
values
    ('furniture', 'demo', 'Möbelstück', 5),
    ('mattress', 'demo', 'Matratze', 3),
    ('large-electrical', 'demo', 'Elektrogroßgerät', 2),
    ('carpet', 'demo', 'Teppich oder Bodenbelag', 4);

insert into bulk_waste_slot (id, tenant_id, slot_date, time_window, capacity, reserved)
values
    ('slot-2026-08-18-am', 'demo', date '2026-08-18', '07:00–12:00 Uhr', 8, 1),
    ('slot-2026-08-20-am', 'demo', date '2026-08-20', '07:00–12:00 Uhr', 8, 3),
    ('slot-2026-08-25-am', 'demo', date '2026-08-25', '07:00–12:00 Uhr', 8, 0);
