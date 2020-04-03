-- create table


CREATE TABLE co_recurso_actividad_grupo
(
	id serial NOT NULL primary key,	
	co_grupo integer NOT NULL  references co_grupo(id),    	
	fecha date not null,		
	url text,
	titulo text,
	descripcion text,	
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,
	activo boolean default true,
	fecha_activo date,	
	numero_orden integer,
	eliminado boolean NOT NULL DEFAULT false    
);

alter table co_recurso_actividad_grupo add column co_sucursal integer;

 alter table co_recurso_actividad_grupo
  add constraint co_grupo_sucursal_fk
  foreign key (co_sucursal)
  references co_sucursal(id);


-- para la sucursal de monterrey
insert into co_recurso_actividad_grupo(co_sucursal,numero_orden,co_grupo,fecha,url,titulo,descripcion,genero,fecha_activo)
values(1,1,6,getDate(''),'https://drive.google.com/embeddedfolderview?id=0B9DcxTxDKBeVfktUdEZ0aE12djdkcW1MQjh5bmxNN0pmeXdrQ3EtdnVoOWNVRkhSMUk4emM#list','Prueba 1','Esto es una prueba',1,getDate(''));


/*

CREATE TABLE co_detalle_recurso_actividad_grupo
(
	id serial NOT NULL primary key,	
	co_recurso_actividad_grupo integer NOT NULL  references co_recurso_actividad_grupo(id),    	
	fecha date not null,
	url text not null,
	titulo text,
	comentarios text,	
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,
	activo boolean default true,
	eliminado boolean NOT NULL DEFAULT false    
);

*/