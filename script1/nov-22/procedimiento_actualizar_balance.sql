

CREATE OR REPLACE FUNCTION public.actualizar_balance_tiempo_alumno(	
	id_alumno integer,		
	id_genero integer)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	tiempo_pagado_record RECORD;
	tiempo_usado_record RECORD;
	tiempo_usado_aplicar numeric;
	tiempo_pagado_aplicar numeric;
	alumno_record RECORD;	
BEGIN

		select * from co_alumno where id = id_alumno INTO alumno_record;
		
		
		IF alumno_record.cat_tipo_cobranza = 2 THEN		
					
					
					select coalesce(sum(tiempo_horas),0) as tiempo_pagado_mes
					from co_cargo_balance_alumno
					where co_balance_alumno = alumno_record.co_balance_alumno and eliminado = false and cat_tipo_cobranza = 2 and pagado = true and to_char(fecha,'YYYYMM') = to_char(getDate(''),'YYYYMM')						 					
					INTO tiempo_pagado_record;
					
					
					SELECT  								
            				 ROUND(
								((EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada))/60)/60)::numeric
						,1) as horas_usadas						
					FROM co_asistencia a inner join co_alumno alumno on a.co_alumno = alumno.id                                                               
                                  			inner join co_balance_alumno balance on balance.id = alumno.co_balance_alumno  
					WHERE  to_char(fecha,'MMYYYY') = to_char(current_date,'MMYYYY') 
							AND a.eliminado = false
						 	AND balance.id = alumno_record.co_balance_alumno
					INTO tiempo_usado_record;

					IF tiempo_usado_record is null  THEN
						raise notice 'NO SE ENCONTRO asistencia';
						tiempo_usado_aplicar := 0;
					ELSE
						tiempo_usado_aplicar := tiempo_usado_record.horas_usadas;
					END IF;

					raise notice 'tiempo_usado_aplicar %',tiempo_usado_aplicar;
					

					update  co_balance_alumno 			
					SET total_adeudo = (
							select sum(total) 
							from co_cargo_balance_alumno 
							where co_balance_alumno = alumno_record.co_balance_alumno
							and eliminado = false
						),			
						total_cargos =(
							select sum(total) from co_cargo_balance_alumno 
							where co_balance_alumno =  alumno_record.co_balance_alumno and eliminado = false
						),
						tiempo_saldo = (tiempo_pagado_record.tiempo_pagado_mes - tiempo_usado_aplicar),
						tiempo_usado = tiempo_usado_aplicar,
						fecha_modifico = (getDate('')+getHora(''))::timestamp,
						modifico = id_genero
			     		where id =  alumno_record.co_balance_alumno; 

					

					--actualizar cargos que se aplicaron - usaron las horas
					update co_cargo_balance_alumno  
					set tiempo_saldo_aplicado = true,
						fecha_tiempo_saldo_aplicado = (getDate('')+getHora(''))::timestamp,
						fecha_modifico = (getDate('')+getHora(''))::timestamp,
						modifico = id_genero,
						aplico_tiempo_saldo = id_genero
					where co_balance_alumno = alumno_record.co_balance_alumno and eliminado = false and cat_tipo_cobranza = 2 and pagado = true and to_char(fecha,'YYYYMM') = to_char(getDate(''),'YYYYMM');
					
			END IF;
						 	

	return true;

END;
$BODY$

