create table address (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    street varchar(160) not null,
    house_number varchar(32) not null,
    postal_code varchar(16) not null,
    city varchar(120) not null,
    district varchar(120),
    display_label varchar(240) not null,
    service_area_id varchar(64) not null
);

create index address_tenant_search_idx on address (tenant_id, street, postal_code, city);

create table collection_event (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    address_id varchar(64) not null references address (id),
    waste_type_id varchar(64) not null,
    waste_type_label varchar(120) not null,
    planned_date date not null,
    effective_date date not null,
    status varchar(32) not null,
    last_modified timestamp with time zone not null default current_timestamp,
    constraint collection_status_check check (status in ('planned', 'moved', 'cancelled', 'additional'))
);

create index collection_address_date_idx on collection_event (tenant_id, address_id, effective_date);

create table waste_guide_entry (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    name varchar(160) not null,
    category varchar(120) not null,
    disposal_route varchar(500) not null,
    notes varchar(1000) not null,
    synonyms varchar(1000) not null,
    data_status timestamp with time zone not null default current_timestamp
);

create index waste_guide_tenant_name_idx on waste_guide_entry (tenant_id, name);

create table disposal_site (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    name varchar(160) not null,
    site_type varchar(100) not null,
    address varchar(240) not null,
    opening_hours varchar(500) not null,
    accepted_waste_types varchar(1000) not null,
    open_now boolean not null,
    data_status timestamp with time zone not null default current_timestamp
);

create table notice (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    address_id varchar(64),
    notice_type varchar(64) not null,
    title varchar(240) not null,
    body varchar(2000) not null,
    priority varchar(32) not null,
    valid_from timestamp with time zone not null,
    valid_until timestamp with time zone not null,
    constraint notice_priority_check check (priority in ('info', 'warning', 'critical'))
);

create index notice_tenant_validity_idx on notice (tenant_id, valid_from, valid_until);

create table case_record (
    id varchar(64) primary key,
    public_reference varchar(25) not null unique,
    tenant_id varchar(63) not null,
    case_type varchar(32) not null,
    subject varchar(240) not null,
    public_status varchar(32) not null,
    summary varchar(2000) not null,
    access_token varchar(160) not null,
    contact_email varchar(320),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    version integer not null default 0,
    constraint case_type_check check (case_type in ('defect', 'bulk-waste')),
    constraint case_status_check check (
        public_status in ('received', 'in-review', 'needs-info', 'in-progress', 'completed', 'rejected', 'closed')
    )
);

create index case_tenant_created_idx on case_record (tenant_id, created_at);

create table case_event (
    id varchar(64) primary key,
    case_id varchar(64) not null references case_record (id),
    status varchar(32) not null,
    public_label varchar(240) not null,
    occurred_at timestamp with time zone not null
);

create index case_event_case_time_idx on case_event (case_id, occurred_at);

create table defect_case (
    case_id varchar(64) primary key references case_record (id),
    category varchar(64) not null,
    address varchar(240) not null,
    description varchar(2000) not null,
    occurred_at timestamp with time zone not null,
    attachment_names varchar(1000) not null,
    consent boolean not null
);

create table bulk_waste_item_rule (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    label varchar(160) not null,
    max_quantity integer not null,
    constraint bulk_item_quantity_check check (max_quantity > 0)
);

create table bulk_waste_slot (
    id varchar(64) primary key,
    tenant_id varchar(63) not null,
    slot_date date not null,
    time_window varchar(120) not null,
    capacity integer not null,
    reserved integer not null default 0,
    constraint bulk_slot_capacity_check check (capacity >= 0 and reserved >= 0 and reserved <= capacity)
);

create table bulk_waste_order (
    case_id varchar(64) primary key references case_record (id),
    address_id varchar(64) not null references address (id),
    slot_id varchar(64) not null references bulk_waste_slot (id),
    items varchar(2000) not null,
    consent boolean not null
);

create table idempotency_record (
    tenant_id varchar(63) not null,
    operation varchar(64) not null,
    idempotency_key varchar(120) not null,
    case_id varchar(64) not null references case_record (id),
    created_at timestamp with time zone not null,
    primary key (tenant_id, operation, idempotency_key)
);

create table outbox_event (
    id varchar(64) primary key,
    aggregate_type varchar(64) not null,
    aggregate_id varchar(64) not null,
    event_type varchar(100) not null,
    payload varchar(4000) not null,
    created_at timestamp with time zone not null,
    published_at timestamp with time zone
);

create index outbox_unpublished_idx on outbox_event (published_at, created_at);
