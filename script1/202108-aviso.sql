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



--query

with avisos AS (
			select ap.id,
					tipo.id as id_tipo,
					em.id as id_empresa	,			   	
					suc.id as id_sucursal,
					grupo.id as id_grupo,
					fam.id as id_familiar
				--	ap.*
			from co_aviso_publicacion ap inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion
											left join co_empresa em on em.id = ap.co_empresa
											left join co_sucursal suc on suc.id = ap.co_sucursal
											left join co_grupo grupo on grupo.id = ap.co_grupo
											left join co_familiar fam on fam.id = ap.co_familiar
			where ap.co_aviso = 92 
				 and ap.eliminado = false
				 and em.eliminado = false
			--	 and suc.elimiando = false
				 --and grupo.eliminado = false
				-- and fam.eliminado = false
		) select --fam.id				
		distinct
				   --af.co_parentesco,
				   fam.correo,
				   fam.token
				   --fam.id as id_familiar,
				   --grupo.id as id_grupo,
				   --suc.id as id_sucursal,
				   --em.id as id_empresa
			from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
										inner join co_alumno al on al.id = af.co_alumno
										inner join co_grupo grupo on grupo.id = al.co_grupo
										inner join co_sucursal suc on suc.id = al.co_sucursal
										inner join co_empresa em on em.id = suc.co_empresa													
										inner join avisos a 
											on a.id_empresa = em.id
												or a.id_sucursal = suc.id
												or a.id_grupo = grupo.id
												or a.id_familiar = fam.id
			where em.id = 1	
					and af.co_parentesco in (1,2)
					and af.eliminado = false
					and fam.eliminado = false
					and grupo.eliminado = false
					and suc.eliminado =false

---querys para los tags
-- tags para las sucursales
select suc.id, 
				'@'||suc.nombre as nombre,				
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				suc.nombre as nombre_mostrar,
				(count(*)||' contactos') as descripcion,
				-1 as id_grupo,
				2 as tipo,
				count(*) as contador_contactos
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
  where 
  	  suc.id in 
	  	(select distinct co_sucursal from si_usuario_sucursal_rol r where usuario = 14 and co_empresa = 1 and r.eliminado = false )	
  	  and af.co_parentesco in (1,2) --Papa y mama 	   	     
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by suc.id




--tags de grupos y sucursales
select grupo.id, 
				'@'||grupo.nombre||' - '||suc.nombre as nombre,							
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				grupo.nombre as nombre_mostrar,
				(count(grupo.*)||' contactos') as descripcion,
				grupo.id as id_grupo,
				3 as tipo,
				count(grupo.*) as contador_contactos
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
				inner join co_grupo grupo on grupo.id = al.co_grupo
  where 
  	  suc.id in 
	  	(select distinct co_sucursal from si_usuario_sucursal_rol r where usuario = 14 and co_empresa = 1 and r.eliminado = false )	
  	  and af.co_parentesco in (1,2) --Papa y mama 	   	     
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by grupo.id,suc.id
order by suc.nombre,grupo.nombre



--tags de contactos por sucursal asignada
select fam.id, 
				fam.nombre as nombre,				
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				fam.nombre as nombre_mostrar,
				(pare.nombre|| ' de '||string_agg(al.nombre,',')) as descripcion,
				grupo.id as id_grupo,
				4 as tipo,
				 count(al.*) as contador_contactos
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
				inner join co_grupo grupo on grupo.id = al.co_grupo
				inner join co_parentesco pare on pare.id = af.co_parentesco
  where 
  	  suc.id in 
	  	(select distinct co_sucursal from si_usuario_sucursal_rol r where usuario = 14 and co_empresa = 1 and r.eliminado = false )	
  	  and pare.id in (1,2) --Papa y mama 	   	     
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by fam.id,suc.id,grupo.id,pare.id
order by fam.nombre

--- completo


--select  array_to_json(array_agg(distinct r.co_sucursal))
	  



with sucursales_usuario as (
 		select distinct co_sucursal 
		from si_usuario_sucursal_rol r 
		where usuario = 14 and co_empresa = 1 and r.eliminado = false 
), universo as (
	select suc.id, 
				'@'||suc.nombre as nombre,				
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				suc.nombre as nombre_mostrar,
				(count(fam.*)||' contactos') as descripcion,
				-1 as id_grupo,
				2 as tipo,
				count(fam.*) as contador_contactos,
				(
					select array_to_json(
                array_agg(row_to_json(fam.*))
				)) as contactos
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
				inner join sucursales_usuario su on su.co_sucursal = suc.id
  where
  	   af.co_parentesco in (1,2) --Papa y mama 	   	     
	  and al.eliminado = false
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by suc.id
union
select grupo.id, 
				'@'||grupo.nombre||' - '||suc.nombre as nombre,				
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				grupo.nombre as nombre_mostrar,
				(count(fam.*)||' contactos') as descripcion,
				grupo.id as id_grupo,
				2 as tipo,
				count(fam.*) as contador_contactos,
				(
					select array_to_json(
                array_agg(row_to_json(fam.*))
				)) as contactos
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
				inner join co_grupo grupo on grupo.id = al.co_grupo
				inner join sucursales_usuario su on su.co_sucursal = suc.id
  where   	  
  	   af.co_parentesco in (1,2) --Papa y mama 	   	     
	  and al.eliminado = false
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by grupo.id,suc.id
union
select fam.id, 
				fam.nombre as nombre,				
				suc.co_empresa as id_empresa,
				suc.id as id_sucursal, 
				fam.nombre as nombre_mostrar,
				(pare.nombre|| ' de '||string_agg(al.nombre,',')) as descripcion,
				grupo.id as id_grupo,
				4 as tipo,
				 count(fam.*) as contador_contactos,
				(
					select array_to_json(
                array_agg(row_to_json(fam.*))
				)) as contactos			
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno                
                inner join co_sucursal suc on suc.id = al.co_sucursal				
				inner join co_grupo grupo on grupo.id = al.co_grupo
				inner join co_parentesco pare on pare.id = af.co_parentesco
				inner join sucursales_usuario su on su.co_sucursal = suc.id
  where   	  
  	   pare.id in (1,2) --Papa y mama 	   	     
	  and al.eliminado = false
      and af.eliminado = false
      and fam.eliminado = false      
      and suc.eliminado =false  
group by fam.id,suc.id,grupo.id,pare.id
) select u.* 
	from universo u 
	order by u.tipo, u.id_sucursal,u.nombre
	
	
	
	
	queri para ver publicion en app


with familiar AS (  
select  
		fam.id,
        fam.nombre,	    
        suc.id as id_sucursal,
        grupo.id as id_grupo,
		em.id as id_empresa,
		al.nombre as hijo
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join co_sucursal suc on suc.id = al.co_sucursal
                inner join co_empresa em on em.id = suc.co_empresa													                          		
 where 
	  fam.id = 54
  	  and af.co_parentesco in (1,2) --Papa y mama 	   	 	  
	  and al.eliminado = false	 
      and af.eliminado = false
      and fam.eliminado = false
      and grupo.eliminado = false
      and suc.eliminado =false 
)
select 
	 aviso.*,
	  ap.id as id_aviso_publicacion,
      tipo.id as id_tipo,
      em.id as id_empresa,			   	
      -1 as id_sucursal,
      -1 as id_grupo,
      f.id as id_familiar    
  from co_aviso aviso 
  				  inner join co_aviso_publicacion ap on ap.co_aviso = aviso.id
				  inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion				  
                  inner join co_empresa em on em.id = ap.co_empresa	
				  inner join familiar f on f.id_empresa = em.id
                 /* left join co_sucursal suc on suc.id = ap.co_sucursal
                  left join co_grupo grupo on grupo.id = ap.co_grupo
                  left join co_familiar fam on fam.id = ap.co_familiar				  */
  where 
  	 tipo.id = 1 	 
	 and ap.eliminado = false
     and em.eliminado = false 