alter table disposal_site add column latitude double precision;
alter table disposal_site add column longitude double precision;

update disposal_site set latitude = 50.792900, longitude = 6.103500 where id = 'site-north';
update disposal_site set latitude = 50.759700, longitude = 6.094100 where id = 'site-park';
update disposal_site set latitude = 50.775400, longitude = 6.083900 where id = 'site-glass';

alter table disposal_site alter column latitude set not null;
alter table disposal_site alter column longitude set not null;
alter table disposal_site add constraint disposal_site_latitude_check check (latitude between -90 and 90);
alter table disposal_site add constraint disposal_site_longitude_check check (longitude between -180 and 180);

insert into address (id, tenant_id, street, house_number, postal_code, city, district, display_label, service_area_id)
values
    ('demo-bahnhofstrasse-18', 'demo', 'Bahnhofstraße', '18', '52064', 'Demo-Stadt', 'West', 'Bahnhofstraße 18, 52064 Demo-Stadt', 'demo-west'),
    ('demo-buchenweg-3', 'demo', 'Buchenweg', '3', '52066', 'Demo-Stadt', 'Süd', 'Buchenweg 3, 52066 Demo-Stadt', 'demo-sued'),
    ('demo-gartenstrasse-41', 'demo', 'Gartenstraße', '41', '52064', 'Demo-Stadt', 'West', 'Gartenstraße 41, 52064 Demo-Stadt', 'demo-west'),
    ('demo-hauptstrasse-9', 'demo', 'Hauptstraße', '9', '52062', 'Demo-Stadt', 'Zentrum', 'Hauptstraße 9, 52062 Demo-Stadt', 'demo-zentrum'),
    ('demo-lindenallee-27', 'demo', 'Lindenallee', '27', '52070', 'Demo-Stadt', 'Nord', 'Lindenallee 27, 52070 Demo-Stadt', 'demo-nord'),
    ('demo-markt-5', 'demo', 'Markt', '5', '52062', 'Demo-Stadt', 'Zentrum', 'Markt 5, 52062 Demo-Stadt', 'demo-zentrum'),
    ('demo-roemerweg-14', 'demo', 'Römerweg', '14', '52072', 'Demo-Stadt', 'Höhenlage', 'Römerweg 14, 52072 Demo-Stadt', 'demo-hoehe'),
    ('demo-schulstrasse-6', 'demo', 'Schulstraße', '6', '52068', 'Demo-Stadt', 'Ost', 'Schulstraße 6, 52068 Demo-Stadt', 'demo-ost'),
    ('demo-sonnenweg-22', 'demo', 'Sonnenweg', '22', '52074', 'Demo-Stadt', 'Campus', 'Sonnenweg 22, 52074 Demo-Stadt', 'demo-campus');

insert into collection_event (id, tenant_id, address_id, waste_type_id, waste_type_label, planned_date, effective_date, status, last_modified)
select
    'collection-' || replace(id, 'demo-', '') || '-2026-08-06',
    tenant_id,
    id,
    'residual',
    'Restabfall',
    date '2026-08-06',
    date '2026-08-06',
    'planned',
    current_timestamp
from address
where id in (
    'demo-bahnhofstrasse-18', 'demo-buchenweg-3', 'demo-gartenstrasse-41',
    'demo-hauptstrasse-9', 'demo-lindenallee-27', 'demo-markt-5',
    'demo-roemerweg-14', 'demo-schulstrasse-6', 'demo-sonnenweg-22'
);
