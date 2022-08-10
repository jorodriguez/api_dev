
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





--para actualizar la fecha de los recargos
update co_alumno 
set fecha_limite_pago_mensualidad = (to_char(current_date,'YYYY')||'-'||to_char(current_date,'MM')||'-'||to_char(fecha_limite_pago_mensualidad,'DD'))::date
where eliminado = false;


--query
/*	
	

with rango_dias as (
		select g::date as dia FROM generate_series('2021-07-01'::date,'2021-07-31'::date, '1 day') g
), 
asistencia as (
		select to_char(r.dia,'DD')::int as no_dia, r.dia,u.nombre, au.hora_entrada::text, au.hora_salida::text,au.comentario_entrada, au.comentario_salida,au.horario_entrada::text, au.horario_salida::text
		from rango_dias r inner join co_asistencia_usuario au on au.fecha = r.dia or au.fecha is null
				  inner join usuario u on u.id = au.usuario 
		where u.visible_reporte 	 
	 		and au.fecha between '2021-07-01' and '2021-07-31'
	 		and u.co_sucursal = 1
	 		and au.eliminado = false
		order by au.fecha, u.nombre
) select rango.dia,a.* from rango_dias rango left join asistencia a on rango.dia = a.dia
*/

-- agrupados por dia

with rango_dias as (
		select g::date as dia FROM generate_series('2021-07-01'::date,'2021-07-31'::date, '1 day') g
), 
asistencia as (
	select to_char(r.dia,'DD')::int as no_dia,r.dia, array_to_json(array_agg(to_json(au.*))) 
		from rango_dias r inner join co_asistencia_usuario au on au.fecha = r.dia or au.fecha is null
				  inner join usuario u on u.id = au.usuario 
		where u.visible_reporte 	 
	 		and au.fecha between '2021-07-01' and '2021-07-31'
	 		and u.co_sucursal = 1
	 		and au.eliminado = false
		group by r.dia
		order by r.dia
) select * from rango_dias rango left join asistencia a on rango.dia = a.dia


---sin agrupacion

with rango_dias as (
		select g::date as dia FROM generate_series('2021-07-01'::date,'2021-07-31'::date, '1 day') g
), 
asistencia as (
		select to_char(r.dia,'DD')::int as no_dia, r.dia,u.nombre, au.hora_entrada::text, au.hora_salida::text--,au.comentario_entrada, au.comentario_salida,au.horario_entrada::text, au.horario_salida::text
		from rango_dias r inner join co_asistencia_usuario au on au.fecha = r.dia or au.fecha is null
				  inner join usuario u on u.id = au.usuario 
		where u.visible_reporte 	 
	 		and au.fecha between '2021-07-01' and '2021-07-31'
	 		and u.co_sucursal = 1
	 		and au.eliminado = false
		order by au.fecha, u.nombre
) select * from rango_dias rango left join asistencia a on rango.dia = a.dia
