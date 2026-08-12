alter table collection_event
    add column publication_status varchar(16) not null default 'published';
alter table collection_event
    add column publication_updated_at timestamp with time zone not null default current_timestamp;
alter table collection_event
    add constraint collection_event_publication_status_check
    check (publication_status in ('draft', 'published'));

alter table waste_guide_entry
    add column publication_status varchar(16) not null default 'published';
alter table waste_guide_entry
    add column publication_updated_at timestamp with time zone not null default current_timestamp;
alter table waste_guide_entry
    add constraint waste_guide_entry_publication_status_check
    check (publication_status in ('draft', 'published'));

alter table disposal_site
    add column publication_status varchar(16) not null default 'published';
alter table disposal_site
    add column publication_updated_at timestamp with time zone not null default current_timestamp;
alter table disposal_site
    add constraint disposal_site_publication_status_check
    check (publication_status in ('draft', 'published'));

alter table notice
    add column publication_status varchar(16) not null default 'published';
alter table notice
    add column publication_updated_at timestamp with time zone not null default current_timestamp;
alter table notice
    add constraint notice_publication_status_check
    check (publication_status in ('draft', 'published'));

create table content_audit_event (
    id varchar(80) primary key,
    tenant_id varchar(80) not null,
    content_type varchar(40) not null,
    content_id varchar(120) not null,
    action varchar(40) not null,
    publication_status varchar(16),
    actor_label varchar(120) not null,
    occurred_at timestamp with time zone not null,
    constraint content_audit_event_type_check
        check (content_type in ('collections', 'waste-guide', 'sites', 'notices')),
    constraint content_audit_event_action_check
        check (action in ('created', 'updated', 'published', 'moved-to-draft', 'deleted')),
    constraint content_audit_event_publication_status_check
        check (publication_status is null or publication_status in ('draft', 'published'))
);

create index content_audit_event_tenant_occurred_idx
    on content_audit_event (tenant_id, occurred_at desc);
