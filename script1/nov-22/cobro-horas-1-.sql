

---------------------------------------------------------------------
---- CAMBIOS EN ESTRUCTURAS ------------
---------------------------------------------------------------------

CREATE TABLE cat_tipo_cobranza
(
	id serial NOT NULL primary key,	
	nombre text,	
	descripcion text,	
	etiqueta_inscripcion text default 'Colegiatura ',
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,			
	eliminado boolean NOT NULL DEFAULT false    
);

insert into cat_tipo_cobranza (id,nombre,descripcion,etiqueta_inscripcion,genero)
values(1,'MENSUAL','Cobro mensual','Colegiatura Mensual',1),
	 (2,'MENSUAL-TIEMPO','Cobro mensual por tiempo definido en la inscripción','Colegiatura Mensual - Horas',1);

alter table co_sucursal add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_sucursal set cat_tipo_cobranza = 1 where id in (1,2,3);

update co_sucursal set cat_tipo_cobranza = 2 where id in (4);

alter table co_sucursal alter column cat_tipo_cobranza set not null;


------ ------ ------ ------ ------ ------ ------ 
-- campo para que se guarde el tiempo en la inscripcion

alter table co_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_alumno set cat_tipo_cobranza = 1;

alter table co_alumno alter column cat_tipo_cobranza set not null;

alter table co_alumno add column tiempo_hora integer;

------ ------ ------ ------ ------ ------ ------ 

------ ------ ------ ------ ------ ------ ------ 
-- campo para que se guarde el tiempo en el balance

alter table co_balance_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_balance_alumno set cat_tipo_cobranza = 1;

alter table co_balance_alumno alter column cat_tipo_cobranza set not null;

alter table co_balance_alumno add column tiempo_saldo numeric not null default 0;

alter table co_balance_alumno add column tiempo_usado numeric not null default 0;


------ ------ ------ ------ ------ ------ ------ 


alter table cat_cargo add column suma_tiempo_saldo boolean not null default false;

alter table cat_cargo add column co_sucursal integer references co_sucursal(id);

update cat_cargo set sistema = false where id >= 1000;


update cat_cargo set co_sucursal = 1, modifico = 1, fecha_modifico=now() where id between 1000 and 1013 and eliminado = false;

---- co sucursal

--alter table co_grupo add column co_sucursal integer references co_sucursal (id);




--separa grupos por sucursal
select * from co_grupo

--separa cargos por sucursal
select * from cat_cargo
select * from co_forma_pago
select * from configuracion








