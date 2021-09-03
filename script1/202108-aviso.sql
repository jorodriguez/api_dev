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

alter table co_aviso add column enviado boolean default false;
alter table co_aviso add column fecha_envio timestamp;
alter table co_aviso add column informacion_envio text;



           insert into si_rol(si_modulo,nombre,genero)
		   values(1,'Administrar Avisos',1);
		   
		   insert into si_opcion(si_modulo,si_opcion,nombre,ruta,icono_menu,genero)
		   values(1,1,'Avisos','CatalogoAvisos','fas fa-email',1)		   
		   --id opcion 5
		   
		   -- si_rol_opcopm
		   --select * from si_rol_opcion
		   insert into si_rol_opcion(si_rol,si_opcion,genero)
		   values(5,5,1);
		   
		   --relacionar usuario y rol
		   --mis tere en sucursal mty
		  insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
		   values(12,1,5,1,1),-- para mty
		          (12,2,5,1,1),-- para apo
				  (12,3,5,1,1)-- para contry
		
		
		  select * from usuario where id = 14
		
			--para miss debanhi
		  insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
		  values(14,1,5,1,1),-- para mty
		          (14,2,5,1,1),-- para apo
				  (14,3,5,1,1)-- para contry
				
		 --para hector
		  insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
		  values(17,1,5,1,1),-- para mty
		          (17,2,5,1,1),-- para apo
				  (17,3,5,1,1)-- para contry


				  update si_opcion set ruta = 'Avisos' where id = 5

--- publicacion del aviso

---TIPO: TODO,SUCURSAL,GRUPO,CONTACTO
CREATE TABLE co_tipo_publicacion
(
	id serial NOT NULL primary key,	
	nombre text not null,
	fecha_genero timestamp without time zone DEFAULT current_timestamp,
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,	
	eliminado boolean NOT NULL DEFAULT false   
);
insert into co_tipo_publicacion(id,nombre,genero)
values(1,'EMPRESA',1),(2,'SUCURSAL',1),(3,'GRUPO',1),(4,'CONTACTO',1);
	

CREATE TABLE co_aviso_publicacion
(
	id serial NOT NULL primary key,	
	co_aviso integer NOT NULL  references co_aviso(id),	
	co_tipo_publicacion integer not null references co_tipo_publicacion(id),		
	co_empresa integer not null references co_empresa(id),	---siempre va un valor aqui
	co_sucursal integer references co_sucursal(id),	
	co_grupo integer references co_grupo(id),	
	co_familiar integer references co_familiar(id),			
	fecha_genero timestamp without time zone DEFAULT current_timestamp,
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,	
	eliminado boolean NOT NULL DEFAULT false    
);
