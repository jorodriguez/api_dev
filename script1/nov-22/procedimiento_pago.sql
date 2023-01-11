


CREATE OR REPLACE FUNCTION public.agregar_pago_alumno(
	ids_cargos text,
	cargos_desglose text,
	ids_cargos_descuento text,	
	id_descuentos_desglose text,
	id_alumno integer,
	pago_param numeric,
	nota text,
	forma_pago_param integer,
	identificador_factura_param text,
	identificador_pago_param text,
	id_genero integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
AS $BODY$
DECLARE
	fecha_current timestamp;
	ids_cargos_relacionar integer[];
	ids_cargos_descuento_aplicar integer[];
	ids_descuentos_array integer[];	
	cargos_desglose_relacionar numeric[];
	id_pago_balance_alumno integer;
	alumno_record RECORD;
	balance_record co_balance_alumno%ROWTYPE;
	retorno integer := 0;
	sqlerr_message_text TEXT;
	sqlerr_exception_detail TEXT;
	sqlerr_exception_hint TEXT;
	id_balance_alumno integer;
	ind int;	
	tiempo_saldo_aplicar numeric;
	existen_cargos_aplicar_tiempo_saldo boolean;
	
	sqlInsertPago TEXT := 'INSERT INTO co_pago_balance_alumno(CO_BALANCE_ALUMNO,FECHA,PAGO,NOTA,GENERO) VALUES($1,$2,$3,$4,$5) RETURNING id INTO id_pago';	
							
	sqlInsertRelacion TEXT := 'INSERT INTO co_pago_cargo_balance_alumno(fecha,co_pago_balance_alumno,co_cargo_balance_alumno,pago,genero) VALUES($1,$2,$3,$4,$5)';									

BEGIN    

	raise notice 'REGISTRAR PAGOS';		
	 ids_cargos_relacionar = string_to_array(ids_cargos,','); 
	 cargos_desglose_relacionar =  string_to_array(cargos_desglose,',');

	 ids_cargos_descuento_aplicar = string_to_array(ids_cargos_descuento,',');
	 ids_descuentos_array = string_to_array(id_descuentos_desglose,',');	 	 
	 
	 existen_cargos_aplicar_tiempo_saldo := false;
	 ind := 0;	
	 
	fecha_current := getDate('');	
	select * from co_alumno where id = id_alumno INTO alumno_record;		
		
	select * from co_balance_alumno where id = alumno_record.co_balance_alumno and eliminado = false 
			INTO balance_record;
	
	raise notice 'pass 1';			
	--IF balance_record is not null THEN
	IF FOUND THEN				
				fecha_current := ((getDate('')+getHora(''))::timestamp);							
				
				INSERT INTO co_pago_balance_alumno(CO_BALANCE_ALUMNO,FECHA,PAGO,NOTA,CO_FORMA_PAGO,IDENTIFICADOR_FACTURA,IDENTIFICADOR_PAGO,GENERO)
							VALUES(balance_record.ID,fecha_current,pago_param,nota,forma_pago_param,identificador_factura_param,identificador_pago_param, id_genero) 
				RETURNING id INTO id_pago_balance_alumno;
									
				raise notice 'id_pago_balance insertartado %',id_pago_balance_alumno;
			
				FOR i IN 1 .. coalesce(array_upper(ids_cargos_descuento_aplicar, 1),1)
				LOOP

				
				
					/*PERFORM aplicar_descuento_cargo(	
						id_alumno,
						ids_cargos_descuento_aplicar[i],
						ids_descuentos_array[i],			
						id_genero);*/
						
				END LOOP;
   			

			raise notice 'relacionar ';
			
			FOR i IN 1 .. array_upper(ids_cargos_relacionar, 1)
   			LOOP
			  						
      				RAISE NOTICE 'relacionando id_cargo % id_pago % cantidad %',ids_cargos_relacionar[i],id_pago_balance_alumno,cargos_desglose_relacionar[i];
					EXECUTE sqlInsertRelacion 
						USING fecha_current,
								id_pago_balance_alumno,
								ids_cargos_relacionar[i],
								cargos_desglose_relacionar[i],								
								id_genero;		
					raise notice 'guardado..';			
					
					--actualizar total en cargo				

					UPDATE co_cargo_balance_alumno
					SET TOTAL_PAGADO = (TOTAL_PAGADO + cargos_desglose_relacionar[i]),
						TOTAL = (TOTAL - cargos_desglose_relacionar[i]),
						pagado = ((TOTAL - cargos_desglose_relacionar[i]) = 0)						
					WHERE id = ids_cargos_relacionar[i];		
					raise notice 'total actualizado..';									
					
   			END LOOP;

   			

			----- APLICAR CARGOS
			-- RECALCULAR BALANCE
			update  co_balance_alumno 			
			SET total_adeudo = (
					select sum(total) 
					from co_cargo_balance_alumno 
					where co_balance_alumno = balance_record.id 
						and eliminado = false
				),			
				total_cargos =(
					select sum(total) from co_cargo_balance_alumno 
					where co_balance_alumno =  balance_record.id and eliminado = false
				),		
				fecha_modifico = (getDate('')+getHora(''))::timestamp,
				modifico = id_genero
			     where id =  balance_record.id; 

		    PERFORM actualizar_balance_tiempo_alumno(balance_record.id,id_genero);

				
		--	END IF;
			
	ELSE
		raise notice 'NO EXISTE EL BALANCE';
	
	END IF;		
	raise notice 'id_pago_balance_alumno %',id_pago_balance_alumno;
	
	return (select id_pago_balance_alumno);
END;
$BODY$