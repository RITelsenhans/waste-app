create table municipality_customization (
    tenant_id varchar(63) primary key,
    name varchar(160) not null,
    short_name varchar(80) not null,
    city varchar(120) not null,
    reporting_office varchar(160) not null,
    phone varchar(80) not null,
    email varchar(320) not null,
    primary_color varchar(7) not null,
    info_color varchar(7) not null,
    updated_at timestamp with time zone not null default current_timestamp
);

insert into municipality_customization (
    tenant_id, name, short_name, city, reporting_office, phone, email,
    primary_color, info_color
) values (
    'demo', 'Demo Kommune', 'Demo', 'Demo-Stadt', 'Bürgerservice Abfall',
    '0241 000000', 'abfall@example.invalid', '#C8102E', '#008F8C'
);
