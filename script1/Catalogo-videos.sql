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