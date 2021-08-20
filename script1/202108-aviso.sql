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
