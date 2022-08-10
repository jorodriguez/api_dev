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


-- alta de carpetas para moneterrey
insert into co_recurso_actividad_grupo(co_sucursal,co_grupo,url,numero_orden,fecha,titulo,descripcion,genero,fecha_activo)
values(1,2,'https://drive.google.com/embeddedfolderview?id=1uET7TzWrFnt9H5WdFVxUeQd6bWays9zt#grid',2,getDate(''),'Mini Magic I ','Carpeta compartida de videos y material didactico de uso exclusivo.',1,getDate(''));
