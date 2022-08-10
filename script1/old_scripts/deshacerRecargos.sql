

--regresar la fecha 
--regresar la fecha de limite 
update co_alumno 
set fecha_limite_pago_mensualidad = (to_char(current_date,'YYYY')||'-'||to_char(current_date,'MM')||'-'||to_char(fecha_limite_pago_mensualidad,'DD'))::date
where eliminado = false and
co_balance_alumno in (select co_balance_alumno from co_cargo_balance_alumno where recargo = false and cat_cargo=4 and fecha::date = current_date)
	;


select * from co_cargo_balance_alumno where recargo = false and cat_cargo=4 and fecha::date = current_date

--actualizar a null la relacion co_cargo_balance_alumno
update co_cargo_balance_alumno set co_cargo_balance_alumno = null 
where co_cargo_balance_alumno in 
(select id from co_cargo_balance_alumno where recargo = false and cat_cargo=4 and fecha::date = current_date)

--eliminar recargos
delete from co_cargo_balance_alumno where recargo = false and cat_cargo=4 and fecha::date = current_date

select * from co_cargo_balance_alumno where co_cargo_balance_alumno = 16971


