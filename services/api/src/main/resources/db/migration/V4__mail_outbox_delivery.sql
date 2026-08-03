alter table outbox_event add column attempt_count integer not null default 0;
alter table outbox_event add column last_error varchar(1000);
alter table outbox_event add column next_attempt_at timestamp with time zone not null default current_timestamp;

create index outbox_mail_delivery_idx
    on outbox_event (event_type, published_at, next_attempt_at, created_at);
