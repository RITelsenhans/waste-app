create table recycling_access_request (
    id varchar(64) primary key,
    public_reference varchar(32) not null unique,
    tenant_id varchar(63) not null,
    site_id varchar(64) not null references disposal_site (id),
    planned_arrival_at timestamp with time zone not null,
    access_window_start timestamp with time zone not null,
    access_window_end timestamp with time zone not null,
    waste_type varchar(64) not null,
    item_description varchar(160) not null,
    identification_method varchar(32) not null,
    credential_hash varchar(64) not null,
    credential_hint varchar(64) not null,
    access_token varchar(160) not null,
    access_status varchar(32) not null,
    gate_state varchar(32) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    version integer not null default 0,
    constraint recycling_access_method_check check (identification_method in ('code', 'license-plate')),
    constraint recycling_access_status_check check (
        access_status in ('authorized', 'entry-granted', 'on-site', 'exit-granted', 'completed')
    ),
    constraint recycling_gate_state_check check (gate_state in ('closed', 'open-entry', 'open-exit'))
);

create index recycling_access_tenant_created_idx
    on recycling_access_request (tenant_id, created_at);

create table recycling_access_event (
    id varchar(64) primary key,
    access_request_id varchar(64) not null references recycling_access_request (id),
    event_type varchar(64) not null,
    public_label varchar(240) not null,
    occurred_at timestamp with time zone not null
);

create index recycling_access_event_request_time_idx
    on recycling_access_event (access_request_id, occurred_at);

create table recycling_access_idempotency (
    tenant_id varchar(63) not null,
    operation varchar(64) not null,
    idempotency_key varchar(120) not null,
    access_request_id varchar(64) not null references recycling_access_request (id),
    created_at timestamp with time zone not null,
    primary key (tenant_id, operation, idempotency_key)
);
