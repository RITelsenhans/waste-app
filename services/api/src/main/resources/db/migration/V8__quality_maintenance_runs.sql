create table quality_maintenance_run (
    id varchar(64) primary key,
    executed_at timestamp with time zone not null,
    cutoff_at timestamp with time zone not null,
    status varchar(32) not null,
    candidate_count integer not null,
    deleted_outbox_events integer not null,
    deleted_case_idempotency_records integer not null,
    deleted_access_idempotency_records integer not null,
    finding varchar(500) not null,
    constraint quality_maintenance_status_check check (status in ('completed', 'disabled', 'blocked'))
);

create index quality_maintenance_executed_idx
    on quality_maintenance_run (executed_at);
