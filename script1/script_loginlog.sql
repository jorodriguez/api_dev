

CREATE TABLE log
(
	id serial NOT NULL primary key,		
	co_familiar integer references co_familiar(id),
	nombre text,					
	correo text,
	telefono text,
	fecha timestamp without time zone DEFAULT (getDate('')+getHora('')),	
	estatus text	
);




CREATE or replace FUNCTION guardar_log(IN co_familiar_param integer,nombre_param text,correo_param text,telefono_param text,estatus_param text) 
RETURNS SETOF integer
LANGUAGE plpgsql 	
AS
$$
DECLARE 
BEGIN  
	raise notice 'log cargos '; 
	insert into log(co_familiar,nombre,correo,telefono,estatus)
        values(co_familiar_param,nombre_param,correo_param,telefono_param,estatus_param);			
	RETURN;		
END;
$$ 

