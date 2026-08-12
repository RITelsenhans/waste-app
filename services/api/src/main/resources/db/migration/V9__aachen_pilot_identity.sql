-- Aachen is the agreed pilot identity. The records remain synthetic until the
-- official municipal address and specialist-system adapters are connected.
update municipality_customization
set name = 'Stadt Aachen · Pilot',
    short_name = 'Aachen',
    city = 'Aachen',
    reporting_office = 'Bürgerservice Abfall',
    updated_at = current_timestamp
where tenant_id = 'demo'
  and name = 'Demo Kommune'
  and city = 'Demo-Stadt';

update address
set city = 'Aachen',
    display_label = replace(display_label, 'Demo-Stadt', 'Aachen')
where tenant_id = 'demo'
  and city = 'Demo-Stadt';

update disposal_site
set address = replace(address, 'Demo-Stadt', 'Aachen'),
    data_status = current_timestamp
where tenant_id = 'demo'
  and address like '%Demo-Stadt%';

-- The moved collection took place on 11 August. Its notice must therefore no
-- longer be returned on 12 August; the API already filters by this validity.
update notice
set valid_until = timestamp with time zone '2026-08-11 23:59:59+02'
where id = 'notice-paper-moved'
  and valid_until = timestamp with time zone '2026-08-12 23:59:59+00';
