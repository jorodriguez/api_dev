

select * from co_alumno where upper(apellidos) like '%TORRES%'

select fecha_genero, eliminado,* 
select * from co_alumno where upper(apellidos) like '%TORRES%'

select fecha_genero, eliminado,* 
from co_alumno 
where id in (313,222,372,297) order by fecha_genero desc

from co_alumno 
where id in (313,222,372,297) order by fecha_genero desc

-- es el que se envia a tere como expediente 
  SELECT a.nombre||' '||a.apellidos as alumno,
 			   to_char(b.fecha,'dd-mm-yyyy HH24:MI') as fecha_format,            
               cargo.nombre||' '||b.texto_ayuda||'-'||to_char(b.fecha,'yyyy') as nombre_cargo,                                                            
               b.cargo,
               case when b.pagado then 'SI' else 'NO' end as pagado,               
			   b.total_pagado as cantidad_pagada,
               b.nota,               
               b.descuento,
			   b.eliminado			
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = 251
					and b.eliminado = false 
              ORDER by b.pagado, b.fecha desc