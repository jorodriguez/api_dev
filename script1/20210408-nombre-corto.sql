alter table co_alumno add column mostrar_nombre_carino boolean not null default false;

alter table co_alumno add column color text;

alter table cat_genero add column foto text;
alter table cat_genero add column tipo text;

update cat_genero set tipo = 'FAMILIAR';

insert into cat_genero(nombre,tipo,foto,genero)
values('Niño','ALUMNO','https://library.kissclipart.com/20180926/pe/kissclipart-student-clipart-utrecht-university-student-vu-univ-01ccd8efac8776f3.jpg',1),
	('Niña','ALUMNO','https://cdn2.iconfinder.com/data/icons/circle-avatars-1/128/037_girl_avatar_profile_woman_child-512.png',1);

alter table co_alumno add column cat_genero integer references cat_genero(id);

update co_alumno set cat_genero = 4 where sexo = 'Niño';
update co_alumno set cat_genero = 5 where sexo = 'Niña';

alter table co_alumno alter column cat_genero set not null;


update co_sucursal set foto = null;




DROP FUNCTION public.generar_horas_extras_alumno(text, integer);

DROP FUNCTION public.generar_horas_extras_asistencia(text, integer);

CREATE OR REPLACE FUNCTION public.generar_horas_extras_asistencia(
	ids_asistencias_param text,
	id_genero integer,
	OUT retorno boolean)
    RETURNS boolean
    LANGUAGE 'plpgsql'
   
AS $BODY$
DECLARE
	asistencia RECORD;	
	hora_generate TIMESTAMP;	
	hora_inicio_hora_extra TIMESTAMP;	
	hora_fin_hora_extra TIMESTAMP;	
	fecha_current TIMESTAMP;	
	hora_extra_encontrada RECORD;
	INTERVALO_TIEMPO_HORA_EXTRA text := '1 hour';
	ID_HORA_EXTRA integer := 3;
	--ID_GENERO integer := 1;
	ID_PADRE integer := 1;
	ID_MADRE integer := 2;
	papas_record RECORD;	
	fallo boolean := false;
	mensaje_fallo text :='';
	token_familiar text := '';
	ids integer[];
bEGIN
	IF ids_asistencias_param is null or ids_asistencias_param = '' THEN		
		raise notice 'Es null la lista de ids se asistencias param ';
		retorno := false;
	ELSE

		 ids := string_to_array(ids_asistencias_param,','); 

		 raise notice ' Ids alumnos % ',ids;

		FOR asistencia IN ( 
				select a.id as id_asistencia,
						a.co_alumno,
						a.fecha as fecha_entrada_asistencia,
						a.hora_entrada as hora_entrada_asistencia ,
						a.hora_salida as hora_salida_asistencia,
						alumno.minutos_gracia,
						alumno.nombre as nombre_alumno, 
						alumno.hora_salida as hora_salida_alumno,
						(alumno.hora_salida + interval '1 minute' * alumno.minutos_gracia) as hora_salida_mas_minutos_gracia_alumno
				from co_asistencia a inner join co_alumno alumno on a.co_alumno = alumno.id
				where a.id = ANY(ids::INT[]) and a.eliminado = false	
				--where a.co_alumno = ANY(ids_alumnos::INT[]) and a.fecha = getDate('') and a.hora_salida is not null and a.eliminado = false	
				order by a.hora_salida desc
				--limit 1

		) LOOP 
			-- si hora de salida de asistencia es mayor a la hora salida registrada + minutos gracias
					IF asistencia.hora_salida_asistencia >= (asistencia.hora_salida_asistencia::date+asistencia.hora_salida_mas_minutos_gracia_alumno) THEN
					raise notice 'calcular horas extras alumno %',asistencia.nombre_alumno;
					FOR hora_generate IN ( 															
								SELECT * FROM generate_series((asistencia.hora_salida_asistencia::date + asistencia.hora_salida_alumno)::timestamp,
												asistencia.hora_salida_asistencia::timestamp,'1 hour')
							) 
					LOOP 	
						hora_inicio_hora_extra := hora_generate;
						hora_fin_hora_extra := (hora_generate + interval '1 hour');
						fecha_current := (getDate('')+getHora(''))::timestamp;
					
						raise notice 'validando la existencia de la hora extra INICIO %  FIN %',hora_inicio_hora_extra,hora_fin_hora_extra;
								select * from co_hora_extra he 
										where fecha::date = asistencia.fecha_entrada_asistencia
												--and co_asistencia = asistencia.id_asistencia
												and co_alumno = asistencia.co_alumno
												and hora_inicio = hora_inicio_hora_extra
												and hora_fin =  hora_fin_hora_extra
												and eliminado = false
						INTO hora_extra_encontrada;
						IF NOT FOUND THEN		
							raise notice 'SE PROCEDE A LA INSERCIÓN';
							/*
							14-nov-19 */
							--modificacion para no generar registros en la tabla co_hora_extra
							INSERT INTO CO_HORA_EXTRA (CO_ASISTENCIA,CO_ALUMNO,FECHA,HORA_INICIO,HORA_FIN,FECHA_GENERO,GENERO)
							VALUES(asistencia.id_asistencia,
									asistencia.co_alumno,
									fecha_current,
								  	hora_inicio_hora_extra,hora_fin_hora_extra,fecha_current,ID_GENERO);							
							
							--fecha date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,folio_mensualidad text,nota text, id_genero integer												
							--fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer
							raise notice 'fecha %',fecha_current;
							
							PERFORM agregar_cargo_alumno(
														fecha_current::date,
														asistencia.co_alumno,
														ID_HORA_EXTRA,1,0,
														'Cargo por Tiempo Extra del '||fecha_current::date||', de '||hora_inicio_hora_extra::time||' a '||(hora_fin_hora_extra)::time||', alumno '||asistencia.nombre_alumno||'.'
														,ID_GENERO);
								
						--insertar en notificaciones
								FOR papas_record IN ( 			
										select rel.envio_avisos,rel.co_alumno,f.token,f.*
												from co_alumno_familiar rel inner join co_familiar f on rel.co_familiar = f.id
										where co_alumno = asistencia.co_alumno
												and rel.autorizado_para_entrega = true
												and rel.eliminado = false
												and f.eliminado = false
												and rel.co_parentesco in (ID_PADRE,ID_MADRE)  
												order by rel.co_parentesco desc  
								) LOOP				
										IF papas_record.token is null THEN
											fallo := true;
											mensaje_fallo := 'EL FAMILIAR NO CUENTA CON UN TOKEN. [ALUMNO '||asistencia.nombre_alumno||']';									
										ELSE
											token_familiar := papas_record.token;
										END IF;	
									
										INSERT INTO SI_NOTIFICACION (FECHA,TITULO,CUERPO,ICON,TOKEN,fallo,mensaje_fallo,FECHA_GENERO,GENERO)
											VALUES(fecha_current,											
														'Cargo por Tiempo Extra',
														'Cargo por Tiempo Extra del '||fecha_current::date||', de '||hora_inicio_hora_extra::time||' a '||(hora_fin_hora_extra)::time||', alumno '
														||asistencia.nombre_alumno||'.',
														'DEFAULT',
														token_familiar,
														fallo,
														mensaje_fallo,
														fecha_current,
														ID_GENERO);			
										raise notice 'INSERCION DE HORA EXTRA EXISTOSA';
								END LOOP;																							
						ELSE 
							raise notice 'YA EXISTE UN REGISTRO CON LAS HORAS EXPECIFICADAS, NO SE INSERTO';
						END IF;					
					
					  END LOOP;-- LOOP DE HORAS GENERADAS
				ELSE 
					raise notice 'SIN CALCULAR HORAS EXTRAS ';
												
				END IF; --END ASISTENCIA + HORA SALIDA						
			END LOOP;					
	END IF; --EN ALUMNOS NOT NULL		
	
	retorno:=true;
	
END; --END FUNCTION 
$BODY$;




DROP FUNCTION public.registrar_salida_alumno(text, text, integer);

CREATE OR REPLACE FUNCTION public.registrar_salida_alumno(
	ids_asistencias_param text,
	ids_asistencias_calculo_horas_extras text,
	id_genero integer,
	OUT retorno boolean)
    RETURNS boolean
    LANGUAGE 'plpgsql'

AS $BODY$
DECLARE
--ULTIMA modificacion : 17 enero , se incluyo que guardara el historico del horario de salida de la tabla co_alumno
	ids_asistencias integer[];
	ids_asistencias_horas_extras integer[];
	id_alumnos_calcular_horas_extras_param text;
BEGIN
	IF ids_asistencias_param is null THEN		
		raise notice 'Es null la lista de ids de asistencias param ';
		retorno := false;
	ELSE
		ids_asistencias := string_to_array(ids_asistencias_param,','); 
		--ids_asistencias_horas_extras := string_to_array(ids_asistencias_calculo_horas_extras,','); 
				
		UPDATE CO_ASISTENCIA 
                     SET hora_salida = (getDate('')+getHora(''))::timestamp,
			  horario_salida = (select (getDate('')+hora_salida) from co_alumno where id = co_alumno),
			 fecha_modifico = (getDate('')+getHora(''))::timestamp,
                     	  modifico = ID_GENERO
               WHERE id = ANY(ids_asistencias::INT[]);
		
		/*select string_agg(co_alumno::text,',') 
		from co_asistencia 
		where id = ANY(id_alumnos_horas_extras::INT[])
		INTO id_alumnos_calcular_horas_extras_param;	*/			

		IF ids_asistencias_calculo_horas_extras is not null and ids_asistencias_calculo_horas_extras <> '' THEN
		
			PERFORM generar_horas_extras_asistencia(ids_asistencias_calculo_horas_extras,ID_GENERO);		
		END IF;
			
	END IF;	
	retorno := true;
END; --END FUNCTION 
$BODY$;

