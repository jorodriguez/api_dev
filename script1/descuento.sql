

CREATE TABLE cat_descuento_cargo
(
	id serial NOT NULL primary key,	
	co_empresa integer NOT NULL  references co_empresa(id),
	nombre text not null,	
	descuento integer not null CHECK (descuento <> 0 and descuento > 0 and descuento <= 100),	
	descuento_decimal numeric not null CHECK (descuento_decimal <> 0 and descuento_decimal > 0 and descuento_decimal <= 1 ),
	fecha_inicio date,	
	fecha_fin date,	
	tiene_vigencia boolean default false,		
	activo boolean default true,
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,	
	eliminado boolean NOT NULL DEFAULT false    
);


alter table co_cargo_balance_alumno add column cat_descuento_cargo integer;
alter table co_cargo_balance_alumno add column descuento numeric not null default 0;
alter table co_cargo_balance_alumno add column fecha_aplico_descuento timestamp;
alter table co_cargo_balance_alumno add constraint cat_desuento_cargo_fk  foreign key (cat_descuento_cargo)
 references cat_descuento_cargo(id);

alter table co_cargo_balance_alumno add column aplico_descuento integer;
alter table co_cargo_balance_alumno add constraint usuario_descuento_fk  foreign key (aplico_descuento)
references usuario(id);


alter table cat_cargo add column aplica_descuento boolean default false;
update cat_cargo set aplica_descuento = true where id = 1;


alter table co_pago_balance_alumno add column identificador_pago text;


alter table co_forma_pago add column escribir_numero_pago boolean default false;
update co_forma_pago set escribir_numero_pago = true where id in (2,3,4);

--- pruebas
insert into cat_descuento_cargo(co_empresa,nombre,descuento,descuento_decimal,fecha_inicio,fecha_fin,activo,genero)
values(1,'-50% Desc.',50,(0.01 * 50),null,null,true,1),
      (1,'-10% Desc.',10,(0.01 * 10),getDate(''),getDate('') + 2,true,1);


--------------------


CREATE OR REPLACE FUNCTION aplicar_descuento_cargo(
	id_alumno int,
	id_cargo int,
	id_descuento int,			
	id_genero integer)
    RETURNS integer
    LANGUAGE 'plpgsql' 
AS $BODY$
DECLARE
	fecha_current timestamp;
	alumno_record co_alumno%ROWTYPE= null;			
	descuento_record cat_descuento_cargo%ROWTYPE = null;			
	cargo_record co_cargo_balance_alumno%ROWTYPE = null;
	balance_record co_balance_alumno%ROWTYPE = null;
	retorno integer := 0;
	sqlerr_message_text TEXT;
	sqlerr_exception_detail TEXT;
	sqlerr_exception_hint TEXT;
	id_balance_alumno integer;
	ind int := 0;			
	aplicar_descuento boolean;	

BEGIN   
	-- creacion 8 de abril 2020
	--nuevo procedimiento para aplicar descuento a cargos
	-- se ocupa antes de realizar el pago

	raise notice 'REGISTRAR DESCUENTO A CARGO';	
	fecha_current := getDate('');	

	-- buscar el alumno
	select * from co_alumno where id = id_alumno and eliminado = false INTO alumno_record;		

	-- buscar balance 
	select * from co_balance_alumno where id = alumno_record.co_balance_alumno and eliminado = false 
			INTO balance_record;
	
	-- buscar el id_descuento 
	select * from cat_descuento_cargo where id = id_descuento and eliminado = false into descuento_record;

	--buscar el cargo
	select * from co_cargo_balance_alumno where id = id_cargo and eliminado = false into cargo_record;

	raise notice 'alumno % balance % id_descuento % ,cargo_record %'
		,alumno_record.nombre,balance_record.id,descuento_record.id,cargo_record.id;

	raise notice 'alumno_record % === %',(alumno_record.id is not null),alumno_record;
	raise notice 'balance_record % === %',(balance_record.id is not  null),balance_record  ;
	raise notice 'descuento_record  % === %',(descuento_record.id is not null),descuento_record;
	raise notice 'cargo_record   % === %',(cargo_record.id  is not null),cargo_record;

	aplicar_descuento = (alumno_record.id is not null AND balance_record.id is not null AND
				descuento_record.id is not null AND
				cargo_record.id is not null );

	  raise notice 'Aplicar descuento %',aplicar_descuento;

	--modificar el cargo - columna descuento
	IF aplicar_descuento THEN		
		---revisar si ya existen pagos realizados, en caso de que si no aplicar nada
		--select * from co_cargo_balance_alumno where id = 14136
		raise notice '>>>>>iniciando aplicacion de descuento<<<<';
		IF cargo_record.descuento is null or cargo_record.descuento = 0 THEN
			--aplica descuento (solo una vez)
			UPDATE co_cargo_balance_alumno 
			set cat_descuento_cargo = descuento_record.id,
			   DESCUENTO = (descuento_record.descuento_decimal * total),
			    --CARGO = cargo_record.cargo - (descuento_record.descuento_decimal * cargo),
			    total = (total - (descuento_record.descuento_decimal * total)),
			    fecha_aplico_descuento = (getDate('')+gethora(''))::timestamp,
			    fecha_modifico = (getDate('')+gethora(''))::timestamp,
			    modifico = id_genero,
			    aplico_descuento = id_genero
			where id = cargo_record.id;  							

			-- modificar el total del balance	
			raise notice 'Actualizar el balance general del alumno';				
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
				)
			where id = balance_record.id;
			
		END IF;		
	END IF;

	select * from co_cargo_balance_alumno where id = id_cargo and eliminado = false into cargo_record;

	raise notice 'DESCUENTO APLICADO %',cargo_record;
		
	return (select cargo_record.id);
END;
$BODY$;


---------------------------
-- agregar pago por alumno
---------------------------
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
	ind int := 0;
	sqlInsertPago TEXT := 'INSERT INTO co_pago_balance_alumno(CO_BALANCE_ALUMNO,FECHA,PAGO,NOTA,GENERO)
							VALUES($1,$2,$3,$4,$5) RETURNING id INTO id_pago';	
							
	sqlInsertRelacion TEXT := 'INSERT INTO co_pago_cargo_balance_alumno(fecha,co_pago_balance_alumno,co_cargo_balance_alumno,pago,genero)
							VALUES($1,$2,$3,$4,$5)';		
							

BEGIN    

	raise notice 'REGISTRAR PAGOS';	
	
	 ids_cargos_relacionar = string_to_array(ids_cargos,','); 
	 cargos_desglose_relacionar =  string_to_array(cargos_desglose,',');

	 ids_cargos_descuento_aplicar = string_to_array(ids_cargos_descuento,',');
	 ids_descuentos_array = string_to_array(id_descuentos_desglose,',');	 	 
	 
	 raise notice 'cargos a relacionar %',ids_cargos_relacionar;
	 raise notice 'cargos desglose a relacionar %',cargos_desglose_relacionar;
	 raise notice 'ids cargos a aplicar %',ids_cargos_descuento_aplicar ;
	 raise notice 'descuentos a aplicar %',ids_descuentos_array;
	 
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
				raise notice 'pass 2';
				---actualizar total balance alumno Agregar cargos								
				/*UPDATE co_balance_alumno 
				SET TOTAL_PAGOS = (TOTAL_PAGOS + pago_param),
						TOTAL_ADEUDO = (TOTAL_ADEUDO - pago_param)				
				where id = balance_record.id;		*/
				
			raise notice 'se registro el pago ';

			raise notice 'aplicar descuentos a cargos ';

			--aplicar descuentos 
			raise notice 'ids_cargos_descuento_aplicar %',ids_cargos_descuento_aplicar; 
			
			
				FOR i IN 1 .. coalesce(array_upper(ids_cargos_descuento_aplicar, 1),1)
				LOOP
				raise notice 'ejecutando aplicar descuento alumno=% , cargo = %, descuentod id =%,genero =%'
						,id_alumno,
						ids_cargos_descuento_aplicar[i],
						ids_descuentos_array[i],			
						id_genero;
						
				PERFORM aplicar_descuento_cargo(	
						id_alumno,
						ids_cargos_descuento_aplicar[i],
						ids_descuentos_array[i],			
						id_genero);
						
				END LOOP;
   			

			raise notice 'relacionar ';
			
			FOR i IN 1 .. array_upper(ids_cargos_relacionar, 1)
   			LOOP
			  --co_pago_cargo_balance_alumno(fecha,co_pago_balance_alumno,co_cargo_balance_alumno,pago,genero)
						
      				RAISE NOTICE 'relacionando id_cargo % id_pago % cantidad %',ids_cargos_relacionar[i],id_pago_balance_alumno,cargos_desglose_relacionar[i];
					EXECUTE sqlInsertRelacion 
						USING fecha_current,
								id_pago_balance_alumno,
								ids_cargos_relacionar[i],
								cargos_desglose_relacionar[i],								
								id_genero;		
					raise notice 'guardado..';			
					
					--actualizar total en cargo
					/*UPDATE co_cargo_balance_alumno
					SET TOTAL_PAGADO = (TOTAL_PAGADO + cargos_desglose_relacionar[i]),
						TOTAL = (TOTAL - cargos_desglose_relacionar[i]),
						pagado = ((TOTAL - cargos_desglose_relacionar[i]) = 0)
						--PAGADO = ( (TOTAL - cargos_desglose_relacionar[i]) = 0 ) 						
					WHERE id = ids_cargos_relacionar[i];		*/

					UPDATE co_cargo_balance_alumno
					SET TOTAL_PAGADO = (TOTAL_PAGADO + cargos_desglose_relacionar[i]),
						TOTAL = (TOTAL - cargos_desglose_relacionar[i]),
						pagado = ((TOTAL - cargos_desglose_relacionar[i]) = 0)						
					WHERE id = ids_cargos_relacionar[i];		
					raise notice 'total actualizado..';									
					
   			END LOOP;

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
				)
			where id = id_alumno;
   			
			
	ELSE
		raise notice 'NO EXISTE EL BALANCE';
	
	END IF;		
	raise notice 'id_pago_balance_alumno %',id_pago_balance_alumno;
	
	return (select id_pago_balance_alumno);
END;
$BODY$;



CREATE TABLE co_aviso
(
	id serial NOT NULL primary key,		
	co_sucursal integer NOT NULL  references co_sucursal(id),
	titulo text not null,	
	descripcion text not null,
	realizo integer NOT NULL  references usuario(id),	
	visto boolean default false,
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,	
	eliminado boolean NOT NULL DEFAULT false    );
