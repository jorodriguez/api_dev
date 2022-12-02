
/* grupos por sucursal */

alter table co_grupo add column co_sucursal integer references co_sucursal(id);

update co_grupo set co_sucursal = 1;

update co_grupo set co_sucursal = 4 where id = 10;

update cat_cargo set sistema = false where id = 1000;


-- partiendo la cobranza de los cargos

alter table co_cargo_balance_alumno add column tiempo_horas numeric not null default 0;

alter table co_cargo_balance_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_cargo_balance_alumno set cat_tipo_cobranza = 1;

alter table co_cargo_balance_alumno alter column cat_tipo_cobranza set not null;


update cat_cargo set suma_tiempo_saldo = true where id = 1