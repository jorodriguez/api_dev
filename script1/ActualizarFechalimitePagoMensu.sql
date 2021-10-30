update co_alumno
set fecha_limite_pago_mensualidad = (to_char(fecha_limite_pago_mensualidad,'YYYY')||'-09-'||to_char(fecha_limite_pago_mensualidad,'dd'))::date
where eliminado = false


hace la pruena de cuando se calulan la fecha de diciembre a enero
update co_alumno
set fecha_limite_pago_mensualidad =
	(
	to_char(current_date,'YYYY')
	||'-' 
 	||to_char( (current_date + interval '1 month')::date,'mm')
 	||'-'
	||to_char(fecha_limite_pago_mensualidad,'dd')
	)::date
where eliminado = false