

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
		
		IF ids_asistencias_calculo_horas_extras is not null and ids_asistencias_calculo_horas_extras <> '' THEN		
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
							
						 	PERFORM agregar_cargo_alumno(current_date,
						 								asistencia_record.id_alumno,
														info_cargo_hora_extra.id,
														1,info_cargo_hora_extra.precio,
														'Cargo por Hora Extra del '|| to_char(hora_generate.generate_series,'DD-MM-YYYY')||' - '|| to_char(hora_generate.generate_series,'HH:MI pm')||', alumno '||asistencia_record.nombre||'.'
														,ID_GENERO
														,0);

						END LOOP;
												
					END IF;
					
					raise notice 'Tiempo  actualizado..';								
					
   			END LOOP;
		

		END IF; -- tipo cobranza
			
	END IF;	
	retorno := true;
END; --END FUNCTION 
$BODY$