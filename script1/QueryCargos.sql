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
               false as checked ,
               0 as pago 
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = $1 and b.eliminado = false and a.eliminado = false
              ORDER by b.pagado, b.fecha desc
             LIMIT 20 







select nombre,
		apellidos,
		costo_inscripcion,
		costo_colegiatura,
		fecha_inscripcion,
		fecha_genero as fecha_registro
select *
from co_alumno
where id = 297

select * from co_cargo_balance_alumno where co_balance_alumno in (297,313) 

SELECT a.nombre||' '||a.apellidos as alumno,                              
               to_char(b.fecha,'dd-mm-yyyy HH24:MI') as fecha,               
               cargo.nombre||' '||b.texto_ayuda as nombre_cargo,               
              -- b.total as total,
               b.cargo,
              -- b.total_pagado,
               b.nota,
               b.pagado ,
               /*(des.id is not null) as descuento_aplicado,
	           des.id as id_descuento,
               des.nombre as nombre_descuento,   */
               b.descuento			   
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo							
             WHERE a.id = 313 
			 	and b.eliminado = false
				--and a.eliminado = false
             ORDER by b.pagado, b.fecha desc
             