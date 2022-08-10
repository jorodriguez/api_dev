CREATE TABLE si_modulo
(
    id serial NOT NULL primary key,
	nombre text,    	
    fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
    fecha_modifico timestamp without time zone,
    genero integer NOT NULL,
    modifico integer,
    eliminado boolean NOT NULL DEFAULT false,    
    CONSTRAINT si_modulo_genero_fkey FOREIGN KEY (genero)
        REFERENCES public.usuario (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT si_modulo_modifico_fkey FOREIGN KEY (modifico)
        REFERENCES public.usuario (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION    
);


CREATE TABLE si_rol
(
    id serial NOT NULL primary key,
	si_modulo integer not null,
	nombre text,    
    fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
    fecha_modifico timestamp without time zone,
    genero integer NOT NULL,
    modifico integer,
    eliminado boolean NOT NULL DEFAULT false,    
    CONSTRAINT si_rol_genero_fkey FOREIGN KEY (genero)
        REFERENCES public.usuario (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT si_rol_modifico_fkey FOREIGN KEY (modifico)
        REFERENCES public.usuario (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT si_rol_modulo_fkey FOREIGN KEY (si_modulo)
        REFERENCES public.si_modulo (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION    
);


CREATE TABLE si_usuario_sucursal_rol
(
    id serial NOT NULL primary key,
    usuario integer NOT NULL references usuario(id),
	co_sucursal integer not null references co_sucursal(id),
    si_rol integer NOT NULL  references si_rol(id),
	co_empresa integer NOT NULL references co_empresa(id),
    fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
    fecha_modifico timestamp without time zone,
    genero integer NOT NULL,
    modifico integer,
    eliminado boolean NOT NULL DEFAULT false    
);

CREATE TABLE si_opcion
(
    id serial NOT NULL primary key,	
	si_modulo integer NOT NULL  references si_modulo(id),    
	si_opcion integer NOT NULL  references si_opcion(id),    
	nombre text,
	ruta text not null,
	icono_menu text,
    fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
    fecha_modifico timestamp without time zone,
    genero integer NOT NULL,
    modifico integer,
    eliminado boolean NOT NULL DEFAULT false    
);


CREATE TABLE si_rol_opcion
(
    id serial NOT NULL primary key,	
	si_rol integer NOT NULL  references si_rol(id),    
	si_opcion integer NOT NULL  references si_opcion(id),    		
    fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
    fecha_modifico timestamp without time zone,
    genero integer NOT NULL,
    modifico integer,
    eliminado boolean NOT NULL DEFAULT false    
);


-- modificaciones en tablas existentes
alter table usuario add column co_empresa integer references co_empresa(id);
alter table co_sucursal add column co_empresa integer references co_empresa(id);
alter table co_alumno add column co_empresa integer references co_empresa(id);
alter table co_familiar add column co_empresa integer references co_empresa(id);

insert into si_modulo(id,nombre,genero)
values(1,'Maestros-web',1),(2,'Reportes-web',1);


insert into si_rol(id,nombre,si_modulo,genero) values(1,'Empleado',1,1);




-- proceso para asignar un rol empleado a 
-- usuario chely para mon
DO
$$
DECLARE 
	usuario_loop RECORD;			
	total_cargos_suma numeric := 0;
	ID_GENERO integer := 1;		
	ID_ROL_EMPLEADO integer := 1;
	ID_EMPRESA integer := 1;
BEGIN  
		raise notice 'eliminar todos los cargos '; 
			
		FOR usuario_loop IN ( 
			select *
			from usuario
			where eliminado = false
		) LOOP 
			raise notice 'asignando rol para  %  ', usuario_loop.nombre;		
			
			insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
			values(usuario_loop.id,usuario_loop.co_sucursal,ID_ROL_EMPLEADO,ID_EMPRESA,ID_GENERO);	 													
			
		END LOOP; 	
END;
$$ 




update co_sucursal set co_empresa = 1;
alter table co_sucursal alter column co_empresa set  not null;


update usuario set co_empresa = 1;
--alter table sucursal alter column co_empresa set  not null;

alter table co_empresa add column activa boolean default true not null;

--usuario tere para las 3 suc
insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
values(12,2,1,1,1),(12,3,1,1,1);;


--usuario de hector
insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
values(17,2,1,1,1),(17,3,1,1,1);;


alter table co_sucursal add column foto text;

CREATE EXTENSION tablefunc;



update co_sucursal set foto = 'https://i2.wp.com/magicintelligence.com/wp-content/uploads/2019/02/cropped-4560barita-magica.png';


-- usuario de socio solo ve contry
	insert into usuario(nombre,correo,co_sucursal,password,permiso_gerente,cat_tipo_usuario,hora_entrada,hora_salida,genero)
	values('Peto','peto@magicintelligence.com',3,'$2a$08$XOjFNU1bEQ4YjNm0/jfvJO4CVbqYKy/DZV0B1QtWuwWFcnh2bmKOC',true,2,'08:00:00','20:00:00',1);
insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
			values((select id from usuario where correo = 'peto@magicintelligence.com'),3,1,1,1);	 
		update usuario set co_empresa = 1,acceso_sistema = true where id = (select id from usuario where correo = 'peto@magicintelligence.com');