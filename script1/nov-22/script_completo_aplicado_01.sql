--cargar nueva sucursal para cobro por horas
insert into co_sucursal(id,nombre,direccion,class_color,co_empresa, foto,genero) values(4,'NUEVO','','red',1,'',1);

insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
valueS(12,4,1,1,1),
	 (12,4,2,1,1),
	 (12,4,3,1,1),
	 (12,4,4,1,1),
	 (12,4,5,1,1);

insert into co_grupo(nombre,color,genero) values('COBRANZA POR HORA','#174CD1',1);



---------------------------------------------------------------------
---- CAMBIOS EN ESTRUCTURAS ------------
---------------------------------------------------------------------

CREATE TABLE cat_tipo_cobranza
(
	id serial NOT NULL primary key,	
	nombre text,	
	descripcion text,	
	etiqueta_inscripcion text default 'Colegiatura ',
	fecha_genero timestamp without time zone DEFAULT (getDate('')+getHora('')),
	fecha_modifico timestamp without time zone,
	genero integer NOT NULL,
	modifico integer,			
	eliminado boolean NOT NULL DEFAULT false    
);

insert into cat_tipo_cobranza (id,nombre,descripcion,etiqueta_inscripcion,genero)
values(1,'MENSUAL','Cobro mensual','Colegiatura Mensual',1),
	 (2,'MENSUAL-TIEMPO','Cobro mensual por tiempo definido en la inscripción','Colegiatura Mensual - Horas',1);

alter table co_sucursal add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_sucursal set cat_tipo_cobranza = 1 where id in (1,2,3);

update co_sucursal set cat_tipo_cobranza = 2 where id in (4);

alter table co_sucursal alter column cat_tipo_cobranza set not null;


------ ------ ------ ------ ------ ------ ------ 
-- campo para que se guarde el tiempo en la inscripcion

alter table co_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_alumno set cat_tipo_cobranza = 1;

alter table co_alumno alter column cat_tipo_cobranza set not null;

alter table co_alumno add column tiempo_hora integer;

------ ------ ------ ------ ------ ------ ------ 

------ ------ ------ ------ ------ ------ ------ 
-- campo para que se guarde el tiempo en el balance

alter table co_balance_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_balance_alumno set cat_tipo_cobranza = 1;

alter table co_balance_alumno alter column cat_tipo_cobranza set not null;

alter table co_balance_alumno add column tiempo_saldo numeric not null default 0;

alter table co_balance_alumno add column tiempo_usado numeric not null default 0;


------ ------ ------ ------ ------ ------ ------ 


alter table cat_cargo add column suma_tiempo_saldo boolean not null default false;

alter table cat_cargo add column co_sucursal integer references co_sucursal(id);

update cat_cargo set sistema = false where id >= 1000;


update cat_cargo set co_sucursal = 1, modifico = 1, fecha_modifico=now() where id between 1000 and 1013 and eliminado = false;





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

//-- modificar el procedimiento que crea un cargo

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
BEGIN    
	raise notice 'AGREGAR CARGO';	
	fecha_current := getDate('');
	
	select * from co_alumno where id = id_alumno INTO alumno_record;		
		
	select * from co_balance_alumno where id = alumno_record.co_balance_alumno and eliminado = false 
			INTO balance_record;
	
	IF FOUND THEN
		SELECT cargo.nombre,cargo.descripcion,cargo.precio,cargo.escribir_monto,sistema
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
					cantidad_aplicar := cantidad; --horas
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
				--(getDate('')+getHora(''))::timestamp
				INSERT INTO co_cargo_balance_alumno(CO_BALANCE_ALUMNO,Cat_Cargo,FECHA,CANTIDAD,CARGO,
													TOTAL,NOTA,MONTO_MODIFICADO,MONTO_ORIGINAL,TEXTO_AYUDA,fecha_genero,GENERO)
				VALUES(
							balance_record.ID,
							id_cargo,
							fecha_cargo+getHora(''),
							cantidad,
							cargo_aplicar,
							(cargo_aplicar * cantidad),					
							nota,
							monto_modificado,
							cargo_original,
							texto_ayuda,
							(getDate('')+getHora(''))::timestamp,
							id_genero
				) RETURNING ID 
				INTO retorno;


		
				---actualizar total balance alumno Agregar cargos								
				UPDATE CO_BALANCE_ALUMNO
				SET TOTAL_CARGOS = (TOTAL_CARGOS + (cargo_aplicar * cantidad)),
					TOTAL_ADEUDO = (TOTAL_ADEUDO + (cargo_aplicar * cantidad))				
				where id = balance_record.id ;
		END IF;
	
	ELSE
		raise notice 'NO EXISTE EL BALANCE';
	
	END IF;		
--	retorno := true;
	return (select retorno);
END;
 $function$



update cat_cargo set co_sucursal = 1, modifico = 1, fecha_modifico=now() where id between 1000 and 1013 and eliminado = false;



-- cargos para la suc de Apodaca 


INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Día Completo Extra','Día Completo',350,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Medio Día Extra','Medio Día extra',250,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material - 30% DESCUENTO','Cuota de Material - 30% desc',3360,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material - 10% DESCUENTO','Cuota de Material',4320.00,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material - 50% DESCUENTO','Cuota de Material - 50% desc',2400,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material 7meses a 1año - C/Convenio','',3000,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material 2 y 3 años - C/Convenio','',4200,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material - 40% DESCUENTO','Cuota de Material - 40% desc',2880,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material - 50% DESCUENTO C/Convenio','Cuota de Material - 50% DESCUENTO C/Convenio',2100,false,false,false,false,false,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Cuota de Material','Cuota de Material',4800,false,false,false,false,true,false,false,1);
INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) VALUES (2,'Programa Online','Programa Online.',2499,true,false,true,false,false,false,false,1);
-- cargo para sumar horas solo se ve en la nueva suc
INSERT INTO cat_cargo (id,co_sucursal,nombre,descripcion,precio,notificar,escribir_monto,genero)
VALUES (5,4,'Horas ','Horas agregadas aplicables al mes en curso',200,false,true,1);


-- cargos para la suc de contry

     INSERT INTO cat_cargo (co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero) 
	VALUES (3,'Día Completo Extra','Día Completo',350,false,false,false,false,false,false,false,1)
          ,(3,'Medio Día Extra','Medio Día extra',250,false,false,false,false,false,false,false,1)
	     ,(3,'Cuota de Material - 30% DESCUENTO','Cuota de Material - 30% desc',3360,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material - 10% DESCUENTO','Cuota de Material',4320.00,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material - 50% DESCUENTO','Cuota de Material - 50% desc',2400,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material 7meses a 1año - C/Convenio','',3000,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material 2 y 3 años - C/Convenio','',4200,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material - 40% DESCUENTO','Cuota de Material - 40% desc',2880,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material - 50% DESCUENTO C/Convenio','Cuota de Material - 50% DESCUENTO C/Convenio',2100,false,false,false,false,false,false,false,1)
		,(3,'Cuota de Material','Cuota de Material',4800,false,false,false,false,true,false,false,1)
		,(3,'Programa Online','Programa Online.',2499,true,false,true,false,false,false,false,1);



/* grupos por sucursal */

alter table co_grupo add column co_sucursal integer references co_sucursal(id);

update co_grupo set co_sucursal = 1;

update co_grupo set co_sucursal = 4 where id = 10;

update cat_cargo set sistema = false where id = 1000;


-- partiendo la cobranza de los cargos

alter table co_cargo_balance_alumno add column tiempo_horas numeric not null default 0;

alter table co_cargo_balance_alumno add column cat_tipo_cobranza integer references cat_tipo_cobranza (id);

update co_cargo_balance_alumno set cat_tipo_cobranza = 1;

alter table co_cargo_balance_alumno alter column cat_tipo_cobranza set not null;


update cat_cargo set suma_tiempo_saldo = true where id = 1



----------------- procedimientos

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
							balance_record.cat_tipo_cobranza,
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
				),
				tiempo_saldo =  (
					select COALESCE(sum(tiempo_horas),0) from co_cargo_balance_alumno 
					where co_balance_alumno = balance_record.id and eliminado = false and cat_tipo_cobranza = 2 and pagado = true and to_char(fecha,'YYYYMM') = to_char(current_date,'YYYYMM')					
				)
			where id = id_alumno;
   			
			
	ELSE
		raise notice 'NO EXISTE EL BALANCE';
	
	END IF;		
	raise notice 'id_pago_balance_alumno %',id_pago_balance_alumno;
	
	return (select id_pago_balance_alumno);
END;
$BODY$;

