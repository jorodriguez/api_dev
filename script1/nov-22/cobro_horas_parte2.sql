

select * from showfunctions where function_definition like '%insertar_bala%'



CREATE OR REPLACE FUNCTION insertar_balance_alumno(IN id_alumno integer,IN id_genero integer,OUT retorno bool) LANGUAGE 'plpgsql' 
AS $BODY$
DECLARE
	alumno_record RECORD;
	existe_registro boolean := false;
	CARGO_MENSUALIDAD int := 1;
	retorno boolean := false;
	sqlerr_message_text TEXT;
	sqlerr_exception_detail TEXT;
	sqlerr_exception_hint TEXT;
	id_balance_alumno integer;
BEGIN    

	raise notice 'INSERTAR BALANCE DEL ALUMNO ';
		--validar si existe el alumno y la relacion con un balance
		select * from co_alumno where id = id_alumno and eliminado = false INTO alumno_record;
		IF FOUND THEN 
			IF alumno_record.co_balance_alumno IS NULL THEN 
	
			INSERT INTO co_balance_alumno(total_adeudo,total_pagos,total_cargos,cat_tipo_cobranza,genero,fecha_genero)
			values(0,0,0,alumno_record.cat_tipo_cobranza,id_genero,(getDate('')+getHora(''))::timestamp) 
			RETURNING ID INTO id_balance_alumno;
			--actualizar el alumno 
			--Aplicar la mensualidad 
			raise notice 'Se inserto el registro ';

			UPDATE CO_ALUMNO SET CO_BALANCE_ALUMNO = id_balance_alumno WHERE ID = id_alumno;
			raise notice 'se relaciono con el nuevo registro';

			/*raise notice 'Agregando cargo de mensualidad al balance %',id_balance_alumno;
			PERFORM agregar_cargo_alumno(id_balance_alumno,
										alumno_loop.id,
										CARGO_MENSUALIDAD,
										1,
										'Cargo generado Automáticamente.',
										1);	
			*/	
			ELSE RAISE NOTICE 'EL ALUMNO YA TIENE UN BALANCE CREADO';
			END IF;
		ELSE 
			RAISE NOTICE 'NO SE ENCUENTRA EL ALUMNO ';
		END IF;
		
								
		retorno := true;
END;
$BODY$;
