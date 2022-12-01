
CREATE OR REPLACE FUNCTION agregar_cargo_alumno(
		fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer
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
				tiempo_horas_aplicar = cantidad;				
		
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
