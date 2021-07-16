
update usuario set activo = false where eliminado = true;
alter table usuario add column visible_reporte boolean default true;

  --CORRER 1 por 1
		   insert into si_rol(si_modulo,nombre,genero)
		   values(2,'Rh',1);
		   
		   insert into si_opcion(si_modulo,si_opcion,nombre,ruta,icono_menu,genero)
		   values(1,1,'Reporte Asistencia Rh','AsistenciasUsuariosRh','fas fa-user',1)		   
		   --id opcion 4
		   
		   -- si_rol_opcopm
		   --select * from si_rol_opcion
		   insert into si_rol_opcion(si_rol,si_opcion,genero)
		   values(4,4,1);
		   
		   --relacionar usuario y rol
		   --mis tere en sucursal mty
		   insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
		   values(12,1,4,1,1),-- para mty
		          (12,2,4,1,1),-- para apo
				  (12,3,4,1,1)-- para contry
		   			
			--para jorge
		  insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
		   values(222,1,4,1,1),-- para mty
		          (222,2,4,1,1),-- para apo
				  (222,3,4,1,1)-- para contry

--query
/*	
			select u.nombre,
						u.fecha_genero as fecha_registro,
						(select min(fecha) from co_asistencia_usuario where usuario = u.id and eliminado = false) as primer_asistencia,						
						(select max(fecha) from co_asistencia_usuario where usuario = u.id and eliminado = false) as ultima_asistencia,						
						count(au.fecha) as asistencias,
						u.activo,
						u.fecha_baja,
						u.motivo_baja,
						u.eliminado as eliminado
			from co_asistencia_usuario au inner join usuario u on u.id = au.usuario
			where au.eliminado = false
			group by u.id,u.nombre,u.fecha_genero,u.fecha_baja,u.motivo_baja,u.activo
			order by u.eliminado, u.nombre,u.fecha_genero,u.fecha_baja
			*/