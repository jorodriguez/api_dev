

select agregar_cargo_alumno(alumno_loop.id,id_cat_cargo,cantidad,nota_cargo,id_genero);

select agregar_cargo_alumno($1,$2,$3,$4,$5,$6,$7) as id_cargo_generado;

select * from co_alumno where nombre like '%Dami%' and eliminado = false

id alumno = 67
 cat_cargo = 1 
 meses : Septiembre, octubre, noviembre y Diciembre
 cantidad :2499
 nota : ''
 genero: 1
 "CARGO AUTOMÁTICO DE MENSUALIDAD MAR."
 
--septiembre 
 select agregar_cargo_alumno('2020-12-01'::date,67,1,1,2499,'CARGO AUTOMÁTICO DE MENSUALIDAD  2020.',1) as id_cargo_generado;
 
 select * from co_cargo_balance_alumno where id = 16803
 
 update co_cargo_balance_alumno set cargo = 2499,total = 2499,texto_ayuda = texto_ayuda||' 2020'  where id in (16804,16805,16806);
 
 select * from co_cargo_balance_alumno where co_balance_alumno = 67 and
 eliminado = false order by fecha desc
 
 SELECT a.co_balance_alumno,
               b.id as id_cargo_balance_alumno,
               b.fecha,
               to_char(b.fecha,'dd-mm-yyyy HH24:MI') as fecha_format,
               b.cantidad,
               cargo.nombre as nombre_cargo,
               cargo.aplica_descuento,
               b.texto_ayuda,
               cat_cargo as id_cargo,
               cargo.es_facturable,
               b.total as total,
               b.cargo,
               b.total_pagado,
               b.nota,
               b.pagado,
               (des.id is not null) as descuento_aplicado,
	           des.id as id_descuento,
               des.nombre as nombre_descuento,   
               b.descuento, 
			   b.fecha_genero,
               false as checked ,
               0 as pago 
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = 67 and b.eliminado = false and a.eliminado = false
              ORDER by b.pagado, b.fecha desc
			
             LIMIT 20
			
			
			
			
			
			
			
			
			do
$$
DECLARE 
	alumno_loop RECORD;
	id_cat_cargo integer := 1;
	nota_cargo text := 'CARGO AUTOMÁTICO DE MENSUALIDAD ';
	cantidad integer := 1;
	id_genero integer :=1;
	nombre_mes text := '';
	total_pagos numeric := 0;
	total_pagos_rel numeric := 0;
	total_cargos_suma numeric := 0;
BEGIN  

	raise notice 'recalculando balances.';

		FOR alumno_loop IN ( 
			select * from co_alumno where id= 67 and eliminado = false
		) LOOP 
			raise notice 'recalculando balancel , alumno % balance % suc % ',alumno_loop.nombre,alumno_loop.co_balance_alumno,alumno_loop.co_sucursal;		
			
					
			select sum(total) from co_cargo_balance_alumno 
					where co_balance_alumno =  alumno_loop.co_balance_alumno and eliminado = false
					INTO total_cargos_suma;			
		
			raise notice 'total cargos % total pagos % ',total_cargos_suma,total_pagos;			
					
			update  co_balance_alumno 			
			SET total_adeudo = total_cargos_suma,			
				total_cargos = total_cargos_suma
			where id = alumno_loop.co_balance_alumno;			
		END LOOP; 	
END;
$$ 
LANGUAGE 'plpgsql';
