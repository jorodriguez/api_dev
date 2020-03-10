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


alter table co_sucursal add column foto text;



query


 with sucursal_usuario AS(
        select DISTINCT suc.*              
            from si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
            where usr.usuario = 17
                and usr.eliminado = false
                and suc.eliminado = false
    ), meses AS (
        select to_char(generate_series,'YYYYMM')  as anio_mes,
                to_char(generate_series,'MM')  as numero_mes
        from generate_series(
							(select date_trunc('year', now())),
					    	(select max(fecha) from co_cargo_balance_alumno where date_trunc('year',fecha) = date_trunc('year',getDate('')))
							,'1 month'
				) 
    )
    SELECT 
            suc.id as id_sucursal,
            suc.nombre as sucursal,
            anio_mes,
            m.numero_mes::integer,
            suc.class_color,              
            count(cargo.*) filter (where cargo.pagado) as cargos_pagados,                          
            count(cargo.*) filter (where cargo.pagado = false) as cargos_no_pagados,                              
            count(cargo.*) as total_cargos                
        from sucursal_usuario suc left join co_alumno al on al.co_sucursal = suc.id
								left join co_cargo_balance_alumno cargo on cargo.co_balance_alumno = al.co_balance_alumno
								left join meses m on  to_char(cargo.fecha,'YYYYMM') = m.anio_mes
        where cargo.cat_cargo = 1  
		--and  suc.id  = 1 
		--and to_char(cargo.fecha,'YYYYMM') = to_char(getDate(''),'YYYYMM') 
		and cargo.eliminado = false 
        GROUP BY m.anio_mes,suc.id,suc.nombre,suc.class_color,m.numero_mes
        ORDER BY m.numero_mes DESC
		
				
		---estr
	 with sucursal_usuario AS(
        select DISTINCT suc.*              
            from si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
            where usr.usuario = 17
                and usr.eliminado = false
                and suc.eliminado = false
    )select suc.id as id_sucursal,
			suc.nombre as sucursal,
			suc.class_color,		
			to_char(cargo.fecha,'MM') as numero_mes,
			count(cargo.*) filter (where cargo.pagado) as cargos_pagados,			   
            count(cargo.*) filter (where cargo.pagado = false) as cargos_no_pagados,			   			   
            count(cargo.*) as total_cargos  
	 from sucursal_usuario suc inner join co_alumno al on al.co_sucursal = suc.id	 
	 							left join co_cargo_balance_alumno cargo on cargo.co_balance_alumno = al.co_balance_alumno
								--and to_char(cargo.fecha,'YYYYMM') = '202008'--to_char(getDate(''),'YYYYMM') 
	where cargo.cat_cargo = 1
	group by suc.id,suc.nombre,suc.class_color, to_char(cargo.fecha,'MM')
	
	
	
				
				
				
				
	with sucursal_usuario AS(
        select DISTINCT suc.*              
            from si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
            where usr.usuario = 17
                and usr.eliminado = false
                and suc.eliminado = false
    ),cargos AS (
		select suc.id as id_sucursal,
			suc.nombre as sucursal,
			suc.class_color,		
			to_char(cargo.fecha,'YYYYMM') as anio_mes,
			count(cargo.*) filter (where cargo.pagado) as cargos_pagados,			   
            count(cargo.*) filter (where cargo.pagado = false) as cargos_no_pagados,			   			   
            count(cargo.*) as total_cargos  
	 from sucursal_usuario suc inner join co_alumno al on al.co_sucursal = suc.id	 
	 							left join co_cargo_balance_alumno cargo on cargo.co_balance_alumno = al.co_balance_alumno							
	where cargo.cat_cargo = 1
	group by suc.id,suc.nombre,suc.class_color, to_char(cargo.fecha,'YYYYMM')
	order by to_char(cargo.fecha,'YYYYMM') desc
	) select
			to_char(generate_series,'YYYYMM')  as anio_mes,
            to_char(generate_series,'MM')  as numero_mes,
			(select nombre from si_meses where id = to_char(generate_series,'MM')::integer) nombre_mes,			
			c.id_sucursal,
			c.sucursal,
			c.class_color,
			c.cargos_pagados,
			c.cargos_no_pagados,
			c.total_cargos
        from generate_series(
							(select date_trunc('year', now())),
					    	(select max(fecha) from co_cargo_balance_alumno where date_trunc('year',fecha) = date_trunc('year',getDate('')) and eliminado = false)
							,'1 month'
				) 	left join cargos c on c.anio_mes = to_char(generate_series,'YYYYMM')
		where --to_char(generate_series,'YYYYMM') = '202003'
				--c.id_sucursal =1
		

        (
				select count(cargo.*) as pagados
				from co_alumno al 
					inner join co_cargo_balance_alumno cargo on cargo.co_balance_alumno = al.co_balance_alumno
				where to_char(cargo.fecha,'YYYYMM') =''-- to_char(getDate(''),'YYYYMM') 
						and cargo.cat_cargo = 1
						and cargo.pagado = true 
						and cargo.eliminado = false
						and al.co_sucursal = suc.id																																			
			)