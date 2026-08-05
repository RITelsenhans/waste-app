insert into collection_event (
    id, tenant_id, address_id, waste_type_id, waste_type_label,
    planned_date, effective_date, status, last_modified
)
values
    ('collection-rest-2026-08-21', 'demo', 'demo-musterstrasse-12', 'residual', 'Restabfall', date '2026-08-21', date '2026-08-21', 'planned', current_timestamp),
    ('collection-bio-2026-08-25', 'demo', 'demo-musterstrasse-12', 'organic', 'Bioabfall', date '2026-08-25', date '2026-08-25', 'planned', current_timestamp),
    ('collection-paper-2026-08-28', 'demo', 'demo-musterstrasse-12', 'paper', 'Papier', date '2026-08-28', date '2026-08-28', 'planned', current_timestamp),
    ('collection-yellow-2026-09-04', 'demo', 'demo-musterstrasse-12', 'packaging', 'Leichtverpackungen', date '2026-09-04', date '2026-09-04', 'planned', current_timestamp),
    ('collection-rest-2026-09-08', 'demo', 'demo-musterstrasse-12', 'residual', 'Restabfall', date '2026-09-08', date '2026-09-08', 'planned', current_timestamp),
    ('collection-bio-2026-09-11', 'demo', 'demo-musterstrasse-12', 'organic', 'Bioabfall', date '2026-09-11', date '2026-09-11', 'planned', current_timestamp),
    ('collection-paper-2026-09-18', 'demo', 'demo-musterstrasse-12', 'paper', 'Papier', date '2026-09-18', date '2026-09-18', 'planned', current_timestamp),
    ('collection-yellow-2026-09-22', 'demo', 'demo-musterstrasse-12', 'packaging', 'Leichtverpackungen', date '2026-09-22', date '2026-09-22', 'planned', current_timestamp),
    ('collection-rest-2026-10-02', 'demo', 'demo-musterstrasse-12', 'residual', 'Restabfall', date '2026-10-02', date '2026-10-02', 'planned', current_timestamp),
    ('collection-bio-2026-10-06', 'demo', 'demo-musterstrasse-12', 'organic', 'Bioabfall', date '2026-10-06', date '2026-10-06', 'planned', current_timestamp),
    ('collection-paper-2026-10-16', 'demo', 'demo-musterstrasse-12', 'paper', 'Papier', date '2026-10-16', date '2026-10-16', 'planned', current_timestamp),
    ('collection-yellow-2026-10-20', 'demo', 'demo-musterstrasse-12', 'packaging', 'Leichtverpackungen', date '2026-10-20', date '2026-10-20', 'planned', current_timestamp);

insert into collection_event (
    id, tenant_id, address_id, waste_type_id, waste_type_label,
    planned_date, effective_date, status, last_modified
)
select
    'collection-next-' || replace(id, 'demo-', ''),
    tenant_id,
    id,
    'residual',
    'Restabfall',
    date '2026-08-12',
    date '2026-08-12',
    'planned',
    current_timestamp
from address
where tenant_id = 'demo'
  and id <> 'demo-musterstrasse-12';
