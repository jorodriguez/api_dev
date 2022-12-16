

CREATE OR REPLACE FUNCTION public.registrar_salida_alumno(
	ids_asistencias_param text,
	ids_asistencias_calculo_horas_extras text,
	id_genero integer,
	id_sucursal integer,
	OUT retorno boolean)
    RETURNS boolean
    LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
	ids_asistencias integer[];
	ids_asistencias_horas_extras integer[];
	id_alumnos_calcular_horas_extras_param text;
	asistencia_record RECORD;
	sucursal_record RECORD;
	tiempo_mensual RECORD;	
	info_cargo_hora_extra RECORD;	
	hora_generate RECORD;
	TIPO_COBRANZA_HORAS integer := 2;	
	TIPO_COBRANZA_MES integer := 1;	
	horas_extra_cobrar integer := 0;
BEGIN
	IF ids_asistencias_param is null THEN		
		raise notice 'Es null la lista de ids de asistencias param ';
		retorno := false;
	ELSE
		ids_asistencias := string_to_array(ids_asistencias_param,','); 
		
		ids_asistencias_horas_extras := string_to_array(ids_asistencias_calculo_horas_extras,','); 

		select * from co_sucursal where id = id_sucursal INTO sucursal_record;
				
		UPDATE CO_ASISTENCIA 
                     SET hora_salida = (getDate('')+getHora(''))::timestamp,
			  		horario_salida = (select (getDate('')+hora_salida) from co_alumno where id = co_alumno),
			 		fecha_modifico = (getDate('')+getHora(''))::timestamp,
                     	modifico = ID_GENERO
           WHERE id = ANY(ids_asistencias::INT[]);
		
		IF ids_asistencias_calculo_horas_extras is not null and ids_asistencias_calculo_horas_extras <> '' and sucursal_record.cat_tipo_cobranza = TIPO_COBRANZA_MES THEN		
			PERFORM generar_horas_extras_asistencia(ids_asistencias_calculo_horas_extras,ID_GENERO);		
		END IF;

		-- MENORAR EL TIEMPO USADO AL BALANCE.
		IF sucursal_record.cat_tipo_cobranza =  TIPO_COBRANZA_HORAS THEN

			select * from cat_cargo where codigo = 'TIEMPO_EXTRA' and co_sucursal = id_sucursal INTO info_cargo_hora_extra;					
			
			FOR asistencia_record IN ( 
			
					SELECT         
						asistencia.id,
        					asistencia.fecha,                        
        					alumno.id as id_alumno,
        					alumno.nombre,                                        
        					balance.id as id_balance,
        					alumno.cat_tipo_cobranza,
        					asistencia.hora_entrada,
        					asistencia.hora_salida,
        					to_char(asistencia.hora_entrada,'dd-MM-YYYY HH:MI pm') as hora_entrada_format,              
        					to_char(asistencia.hora_salida,'dd-MM-YYYY HH:MI pm') as hora_salida_format,           
        					to_char((asistencia.hora_salida - asistencia.hora_entrada),'HH24:MI') as tiempo_usado,
	   					balance.tiempo_saldo,		
	   					alumno.minutos_gracia,  		  
	   					ROUND(((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60)::numeric,0) AS tiempo_usado_integer,		    		
	   					ROUND(((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60)::numeric,2) AS tiempo_usado_decimal,		    		
        					balance.tiempo_saldo - ((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60) < 0 as adeuda_tiempo,            
        					ABS(balance.tiempo_saldo - ((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60)),
        					case when balance.tiempo_saldo - ((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60) < 0 THEN        
                				     (
                				     	ABS(balance.tiempo_saldo - ((EXTRACT(EPOCH FROM (asistencia.hora_salida - asistencia.hora_entrada))/60)/60))::text ||'hours'
                				     )::interval                       
        					ELSE '00:00'::interval 
        					END as tiempo_adeuda,		
        					true as seleccionado_cobrar_tiempo_extra
        					--( asistencia.id IN (ids_asistencias_horas_extras::INT[])) as seleccionado_cobrar_tiempo_extra				
    					FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id                                                               
                                  inner join co_balance_alumno balance on balance.id = alumno.co_balance_alumno     
   					WHERE asistencia.id = ANY(ids_asistencias::INT[])            	
   					
			) LOOP    		

			
					UPDATE CO_ASISTENCIA 
                     	SET  log_movimiento = '{'
                     						||'entrada:"'||asistencia_record.hora_entrada_format||'"'
                     						||',salida:"'||asistencia_record.hora_salida_format||'"'
                     						||',tiempo_usado:"'||asistencia_record.tiempo_usado||'"'
                     						||',adeuda_tiempo:'||asistencia_record.adeuda_tiempo
                     						||',tiempo_adeuda:"'||asistencia_record.tiempo_adeuda||'"'
                     						||',tiempo_saldo:'||asistencia_record.tiempo_saldo 
                     					   	||'}',                     					   
                     		modifico = ID_GENERO
            			WHERE id = asistencia_record.id; --ANY(ids_asistencias::INT[]);					          			

            			SELECT  
            				 ROUND(
								((EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada))/60)/60)::numeric
						,1) as horas_usadas_mes,
						 CASE WHEN  balance.tiempo_saldo - ROUND(((EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada))/60)/60)::numeric,1) <= 0  THEN
								  0						    				
						 ELSE 	
						 		balance.tiempo_saldo - ROUND(
									((EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada))/60)/60)::numeric
								,1)
						 END AS balance_actualizado						
					FROM co_asistencia a inner join co_alumno alumno on a.co_alumno = alumno.id                                                               
                                  			inner join co_balance_alumno balance on balance.id = alumno.co_balance_alumno  
					WHERE  to_char(fecha,'MMYYYY') = to_char(current_date,'MMYYYY') 
							AND a.eliminado = false
						 	AND balance.id =  asistencia_record.id_balance					 							 	
					INTO tiempo_mensual;
					
					--actualizar el tiempo en el balance 
					UPDATE co_balance_alumno
					SET 	tiempo_usado = tiempo_mensual.horas_usadas_mes,
						tiempo_saldo = tiempo_mensual.balance_actualizado						
					WHERE id = asistencia_record.id_balance;

					-- GENERAR CARGOS POR TIEMPO EXTRA								
					--IF (asistencia_record.seleccionado_cobrar_tiempo_extra AND asistencia_record.adeuda_tiempo) THEN
					IF (asistencia_record.seleccionado_cobrar_tiempo_extra AND asistencia_record.adeuda_tiempo) THEN
						 
						 --horas_extra_cobrar := asistencia_record.tiempo_usado_integer;
						 
						 --IF (asistencia_record.tiempo_usado_decimal >= (asistencia_record.tiempo_usado_integer::numeric + 0.10)) THEN 						 	
						 --	horas_extra_cobrar := horas_extra_cobrar + 1;
						 --END;

						-- crear cargos 
						FOR hora_generate IN ( 															
								SELECT * FROM generate_series(
											 asistencia_record.hora_entrada + (asistencia_record.tiempo_saldo || 'hours')::interval,
											 asistencia_record.hora_salida
											 ,'1 hour')
							) 
						LOOP 							     

							--fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer,horas integer
							--int4 = public.agregar_cargo_alumno(date, integer, integer, integer, numeric, text, integer, integer)
						 	PERFORM agregar_cargo_alumno(current_date,
						 								asistencia_record.id_alumno,
														info_cargo_hora_extra.id,
														1,info_cargo_hora_extra.precio,
														'Cargo por Hora Extra del '|| to_char(hora_generate.generate_series,'DD-MM-YYYY')||' - '|| to_char(hora_generate.generate_series,'HH:MI pm')||', alumno '||asistencia_record.nombre||'.'
														,ID_GENERO
														,0);

							--select * from showfunctions where function_definition like '%agregar_cargo%'

						END LOOP;
												
					END IF;
					
					raise notice 'Tiempo  actualizado..';								
					
   			END LOOP;
		

		END IF; -- tipo cobranza
			
	END IF;	
	retorno := true;
END; --END FUNCTION 
$BODY$






--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
-- generar cargos por horas extras
--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 




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
							
							
							raise notice 'fecha %',fecha_current;

							--agregar_cargo_alumno(date, integer, integer, integer, numeric, text, integer, integer)
							
							
							PERFORM agregar_cargo_alumno(
														fecha_current::date,
														asistencia.co_alumno,
														ID_HORA_EXTRA,
														1,
														0,
														'Cargo por Tiempo Extra del '||fecha_current::date||', de '||hora_inicio_hora_extra::time||' a '||(hora_fin_hora_extra)::time||', alumno '||asistencia.nombre_alumno||'.'
														,ID_GENERO,
														0);
								
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