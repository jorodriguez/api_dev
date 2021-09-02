update co_alumno
set fecha_limite_pago_mensualidad = (to_char(fecha_limite_pago_mensualidad,'YYYY')||'-09-'||to_char(fecha_limite_pago_mensualidad,'dd'))::date
where eliminado = false