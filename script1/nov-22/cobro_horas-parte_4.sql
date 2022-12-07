select * from co_alumno

select insertar_balance_alumno(419,1)


select * from co_balance_alumno


select * from cat_cargo
 
 partir los cargos por sucursal

 
 select * from showfunctions where function_definition like '%agregar_cargo_alumno%'



select * from cat_cargo


update cat_cargo set co_sucursal = 1, modifico = 1, fecha_modifico=now() where id between 1000 and 1013 and eliminado = false;



-- cargos para la suc de Apodaca 

select 2 as co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero
from cat_cargo where eliminado = false and id > 1000

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

select 3 as co_sucursal,nombre,descripcion,precio,notificar,sistema,es_facturable,escribir_cantidad,escribir_monto,seleccionar_fecha,aplica_descuento,genero
from cat_cargo where eliminado = false and id > 1000

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


select * from cat_tipo_cobranza

select * from cat_cargo

select cargo.*
from cat_cargo cargo
where cargo.eliminado = false 
	and cargo.co_sucursal = 2
	or (sistema = true and co_sucursal is null )




