drop function agregar_cargo_alumno( date, integer,  integer, integer, numeric, text, integer);


CREATE OR REPLACE FUNCTION agregar_cargo_alumno(
		fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer,horas integer
	)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
	alumno_record RECORD;
	cargo_record RECORD;
	balance_record co_balance_alumno%ROWTYPE;
	fecha_current date;
	fecha_inicio date;
	cargo_monetario numeric;
	fecha_fin date;	
	_numero_anio int;
	_numero_mes int;	
	_nombre_mes text;	
	CARGO_MENSUALIDAD int := 1;
	CARGO_INSCRIPCION int := 2;
	CARGO_HORA_EXTRA int := 3;	
	CARGO_AGREGAR_HORAS int := 5;	
	suma_total numeric;
	cargo_aplicar numeric := 0;
	cargo_original numeric := 0;
	monto_modificado boolean := false;
	cantidad_aplicar integer := 1;
	existe_registro boolean := false;
	retorno integer := null;
    sqlerr_message_text TEXT;
    sqlerr_exception_detail TEXT;
    sqlerr_exception_hint TEXT;
	id_balance_alumno integer;
	existe_cargo boolean := false;
	proceder_insert boolean := true;
	texto_ayuda text :='';				
	tiempo_horas_aplicar numeric := 0;
	TIPO_COBRANZA_MENSUAL int := 1;
	TIPO_COBRANZA_TIEMPO int := 2;
	monto_aplicar numeric := 0;
	
BEGIN    
	raise notice 'AGREGAR CARGO';	
	fecha_current := getDate('');


	select * from co_alumno where id = id_alumno INTO alumno_record;		
		
	select * from co_balance_alumno where id = alumno_record.co_balance_alumno and eliminado = false 
			INTO balance_record;
	
	IF FOUND THEN
		SELECT cargo.nombre,cargo.descripcion,cargo.precio,cargo.escribir_monto,sistema,suma_tiempo_saldo
		FROM cat_cargo cargo 
		WHERE cargo.id = id_cargo
		INTO cargo_record;					
	
		-- nueva version
		raise notice ' iniciando validacion '; 
		
		CASE id_cargo 
			WHEN CARGO_MENSUALIDAD THEN
				raise notice 'Aplicando cargo de mensualidad ';					
				cargo_aplicar := alumno_record.costo_colegiatura;		
				IF fecha_cargo = null THEN
				    raise notice 'la fecha de la mensualidad es null ';
					proceder_insert = false;
				ELSE 
						raise notice 'proceder al insert';
						select true 
						from co_cargo_balance_alumno 
						where cat_cargo = CARGO_MENSUALIDAD AND co_balance_alumno = balance_record.id
													AND to_char(fecha::date,'MMYYYY') =  to_char(fecha_cargo,'MMYYYY')
													AND eliminado = false
						INTO existe_cargo;		
							
						--llenar el campo texto_ayuda con el nombre del mes
						select coalesce(initcap(nombre),'-') from si_meses where id = to_char(fecha_cargo::date,'mm')::int 
						INTO texto_ayuda;
				
						raise notice 'el cargo de mensualidad existe ? %',existe_cargo;
						IF existe_cargo THEN
							proceder_insert = false;
						END IF;				
				END IF;				
				
			WHEN CARGO_INSCRIPCION THEN
					raise notice 'COSTO INSCRIPCION';
				    cargo_aplicar := alumno_record.costo_inscripcion;				 
			WHEN CARGO_HORA_EXTRA THEN				
					raise notice 'Cargo por hora extra, se toma el precio del catalogo';
					cargo_aplicar := cargo_record.precio;		
			WHEN CARGO_AGREGAR_HORAS THEN
					raise notice 'Cargo para agregar horas extras al alumno';
					--cargo_aplicar := cargo_record.precio;		
					cargo_aplicar := monto; 
					cantidad_aplicar := cantidad; 	
					tiempo_horas_aplicar := horas;				
			ELSE 
					raise notice 'ningun cargo especial se toma el precio del catalogo' ;
					cargo_aplicar := cargo_record.precio;		
		END CASE;		
		
		-- registrar detalle					
		raise notice 'PROCEDER AL INSERRT %',proceder_insert;
		
		IF proceder_insert THEN 
		
			cargo_original := cargo_aplicar;	
			
			IF cargo_record.escribir_monto = true THEN		
				raise notice 'El monto del cargo es el monto del parametro';
				cargo_aplicar := monto; -- monto del parametro
				monto_modificado := (cargo_original <> cargo_aplicar);
			END IF;

			IF alumno_record.cat_tipo_cobranza = TIPO_COBRANZA_MENSUAL THEN																	
				
				monto_aplicar := (cargo_aplicar * cantidad);
				tiempo_horas_aplicar := 0;
				
			END IF; -- end TIPO_COBRANZA_MENSUAL
			
			IF alumno_record.cat_tipo_cobranza = TIPO_COBRANZA_TIEMPO THEN		

				monto_aplicar := monto;			
				tiempo_horas_aplicar := 0;				

				IF id_cargo = CARGO_MENSUALIDAD or cargo_record.suma_tiempo_saldo THEN 
					tiempo_horas_aplicar = alumno_record.tiempo_hora; -- el tiempo definido en la inscripcion
					tiempo_horas_aplicar := horas;
				END IF;
		
			END IF;-- end TIPO_COBRANZA_MENSUAL

				INSERT INTO co_cargo_balance_alumno(CO_BALANCE_ALUMNO,Cat_Cargo,FECHA,CANTIDAD,CARGO,
											 TOTAL,NOTA,MONTO_MODIFICADO,MONTO_ORIGINAL,TEXTO_AYUDA,	
											 cat_tipo_cobranza,		
											 tiempo_horas,									 									
											 fecha_genero,
											 GENERO)
					VALUES(
							balance_record.ID,
							id_cargo,
							fecha_cargo+getHora(''),
							cantidad,
							cargo_aplicar,
							monto_aplicar,					
							nota,
							monto_modificado,
							cargo_original,
							texto_ayuda,
							alumno_record.cat_tipo_cobranza,
							tiempo_horas_aplicar,
							(getDate('')+getHora(''))::timestamp,
							id_genero
				) RETURNING ID 
				INTO retorno;

				---actualizar total balance alumno Agregar cargos								
				UPDATE CO_BALANCE_ALUMNO
				SET TOTAL_CARGOS = (TOTAL_CARGOS + (cargo_aplicar * cantidad)),
					TOTAL_ADEUDO = (TOTAL_ADEUDO + (cargo_aplicar * cantidad))				
				where id = balance_record.id ;
			
			
		END IF; -- end procede_inser

		
	
	ELSE
		raise notice 'NO EXISTE EL BALANCE';
	
	END IF;		
--	retorno := true;
	return (select retorno);
END;
 $function$






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
														,ID_GENERO,0);
								
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
