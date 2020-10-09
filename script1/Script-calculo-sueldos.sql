
alter table usuario add column sueldo_mensual numeric;
alter table usuario add column sueldo_quincenal numeric;
update usuario set sueldo_mensual = 0;
update usuario set sueldo_quincenal = 0;
alter table usuario alter column sueldo_mensual set not null;
alter table usuario alter column sueldo_quincenal set not null;

--nuevo rol
insert into si_rol(si_modulo,nombre,genero)
values(1,'Administra Sueldos',1);

alter table si_opcion alter column si_opcion drop not null;
insert into si_opcion(id,si_modulo,si_opcion,nombre,ruta,genero)
values(1,1,null,'Administración','Administracion',1);

insert into si_rol_opcion(si_rol,si_opcion,genero)
values(2,1,1);


--opcion de reporte agregada al rol
insert into si_opcion(id,si_modulo,si_opcion,nombre,ruta,genero)
values(2,1,1,'Sueldos y Asistencias','AsistenciasUsuarioSucursal',1);

insert into si_rol_opcion(si_rol,si_opcion,genero)
values(2,2,1)

insert into si_rol_opcion(si_rol,si_opcion,genero)
values(3,3,1);

update si_opcion set icono_menu = 'fas fa-user' where id = 1;
update si_opcion set icono_menu = 'fas fa-calendar-check' where id = 2;


-- rol admin para las 3 sucursales
insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
values(12,1,2,1,1),(12,2,2,1,1),(12,3,2,1,1);


---query que calcula sueldos y descuentos por dias 

with dias_activos_trabajados AS(		
            SELECT count(*) as dias_laborables
            FROM  generate_series('2020-09-01'::date,'2020-09-15'::date,'1 day')  g
            WHERE g::date not in (select fecha 
                                    from cat_dias_asueto 
                                    where cat_empresa = 1
                                        and fecha between '2020-09-01'::date  and '2020-09-15'::date
                                        and activo=true 
                                        and eliminado = false)
                  and to_char(g::date,'d')::int not in (1,7)
        ) select 
            u.id,
            u.nombre as usuario,
            u.hora_entrada::text,
            u.hora_salida::text,
			(u.hora_salida-u.hora_entrada)::time as horas_trabajar_por_dia,
			(d.dias_laborables * (u.hora_salida-u.hora_entrada)) as horas_trabajar_dias_laborales,
			sum(age(au.hora_salida,au.hora_entrada)) as horas_trabajadas_dias_laborales,
			count(au.hora_entrada) filter (where au.hora_entrada is not null) as count_checo_entrada,
			count(au.hora_salida) filter (where au.hora_salida is not null) as count_checo_salida,
			ROUND(u.sueldo_mensual,2) as sueldo_base_mensual,			
			ROUND(u.sueldo_quincenal,2) as sueldo_base_quincenal,
		    ((d.dias_laborables - count(au.id)) * 100) / d.dias_laborables as porcentaje_falta,						
			ROUND(
					(
						u.sueldo_quincenal - (u.sueldo_quincenal * ((d.dias_laborables::numeric - count(au.id)::numeric) / d.dias_laborables))
					)
				  ,2) as sueldo_quincenal_pago,
			ROUND(
					(
						u.sueldo_mensual - u.sueldo_mensual * ((d.dias_laborables - count(au.id)) / d.dias_laborables)
					)
				,2) as sueldo_mensual_pago,			
			count(au.id) as count_dias_asistencia,
            d.dias_laborables - count(au.id) as count_dias_faltas,
            d.dias_laborables
        from dias_activos_trabajados d, usuario u left join co_asistencia_usuario au on au.usuario = u.id 
                                                and au.fecha between '2020-09-01'::date  and '2020-09-15'::date
        where u.co_sucursal = 1and u.cat_tipo_usuario = 1 and u.eliminado = false		  
            group by u.id,d.dias_laborables
            order by u.nombre


with dias_activos_trabajados AS(		
            SELECT count(*) as dias_laborables
            FROM  generate_series('2020-10-01T05:00:00.000Z'::date,'2020-10-15T05:00:00.000Z'::date,'1 day')  g
            WHERE g::date not in (select fecha 
                                    from cat_dias_asueto 
                                    where cat_empresa = 1
                                        and fecha between '2020-10-01T05:00:00.000Z'::date  and '2020-10-15T05:00:00.000Z'::date
                                        and activo=true 
                                        and eliminado = false)
                  and to_char(g::date,'d')::int not in (1,7)
        ) select 
            u.id,
            u.nombre as usuario,
            u.hora_entrada::text,
            u.hora_salida::text,
			(u.hora_salida-u.hora_entrada)::text as horas_trabajar_por_dia,
			(d.dias_laborables * (u.hora_salida-u.hora_entrada)) as horas_trabajar_dias_laborales,
			coalesce(sum(age(au.hora_salida,au.hora_entrada)),'00:00') as horas_trabajadas_dias_laborales,
			coalesce(count(au.hora_entrada) filter (where au.hora_entrada is not null),0) as count_checo_entrada,
			coalesce(count(au.hora_salida) filter (where au.hora_salida is not null),0) as count_checo_salida,
			ROUND(u.sueldo_mensual,2) as sueldo_base_mensual,			
			ROUND(u.sueldo_quincenal,2) as sueldo_base_quincenal,
		    ((d.dias_laborables - count(au.id)) * 100) / d.dias_laborables as porcentaje_falta,						
			ROUND(
					(
						u.sueldo_quincenal - (u.sueldo_quincenal * ((d.dias_laborables::numeric - count(au.id)::numeric) / d.dias_laborables))
					)
				  ,2) as sueldo_quincenal_pago,
			ROUND(
					(
						u.sueldo_mensual - u.sueldo_mensual * ((d.dias_laborables - count(au.id)) / d.dias_laborables)
					)
				,2) as sueldo_mensual_pago,			
			count(au.id) as count_dias_asistencia,
            d.dias_laborables - count(au.id) as count_dias_faltas,
            d.dias_laborables
        from dias_activos_trabajados d, usuario u left join co_asistencia_usuario au on au.usuario = u.id 
                                                and au.fecha between '2020-10-01T05:00:00.000Z'::date  and '2020-10-15T05:00:00.000Z'::date
        where u.co_sucursal = 1and u.cat_tipo_usuario = 1 and u.eliminado = false		  
            group by u.id,d.dias_laborables
            order by u.nombre



           --cambio de query para calcular por precio del dia
            