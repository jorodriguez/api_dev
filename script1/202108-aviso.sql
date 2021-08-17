drop table co_aviso;

CREATE TABLE co_aviso
(
	id serial NOT NULL primary key,	
	co_empresa integer NOT NULL  references co_empresa(id),	
	fecha date not null,				
	para text not null,
	titulo text not null,
	aviso text not null,
	etiquetas text not null,
	nota_interna text,		
	visto_en_movil boolean default false,
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,	
	eliminado boolean NOT NULL DEFAULT false    
);

