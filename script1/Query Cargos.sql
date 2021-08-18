

select * from co_alumno where upper(apellidos) like '%TORRES%'

select fecha_genero, eliminado,* 
select * from co_alumno where upper(apellidos) like '%TORRES%'

select fecha_genero, eliminado,* 
from co_alumno 
where id in (313,222,372,297) order by fecha_genero desc

from co_alumno 
where id in (313,222,372,297) order by fecha_genero desc


 SELECT a.nombre||' '||a.apellidos,
 			to_char(b.fecha,'dd-mm-yyyy HH24:MI') as fecha_format,            
               cargo.nombre||' '||b.texto_ayuda as nombre_cargo,                                                            
               b.cargo,
               --b.total_pagado,
               b.nota,
               b.pagado,               
               b.descuento               
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = 222
					and b.eliminado = false 
              ORDER by b.pagado, b.fecha desc
             --LIMIT 20

