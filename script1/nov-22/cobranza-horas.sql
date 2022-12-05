

select * from co_empresa order by id desc

select * from co_template order by id desc

select * from configuracion

update usuario set password = '$2a$08$XOjFNU1bEQ4YjNm0/jfvJO4CVbqYKy/DZV0B1QtWuwWFcnh2bmKOC' where id =12

--cargar nueva sucursal para cobro por horas
insert into co_sucursal(id,nombre,direccion,class_color,co_empresa, foto,genero) values(4,'NUEVO','','red',1,'',1);

insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
valueS(12,4,1,1,1),
	 (12,4,2,1,1),
	 (12,4,3,1,1),
	 (12,4,4,1,1),
	 (12,4,5,1,1);



insert into co_grupo(nombre,color,genero) values('COBRANZA POR HORA','#174CD1',1);



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

alter table co_balance_alumno add column tiempo integer not null default 0;

------ ------ ------ ------ ------ ------ ------ 




---- co sucursal

--alter table co_grupo add column co_sucursal integer references co_sucursal (id);




--separa grupos por sucursal
select * from co_grupo

--separa cargos por sucursal
select * from cat_cargo
select * from co_forma_pago
select * from configuracion








