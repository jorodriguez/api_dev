
CREATE TABLE log
(
	id serial NOT NULL primary key,		
	id_usuario integer references usuario(id),
	nombre text,					
	fecha timestamp without time zone DEFAULT (getDate('')+getHora('')),
	log text,	
	estatus text
	
);



CREATE or replace FUNCTION guardar_log(IN id_usuario_param integer,nombre_param text,log_param text,estatus_param text) 
RETURNS SETOF integer
LANGUAGE plpgsql 	
AS
$$
DECLARE 
BEGIN  
	raise notice 'log cargos '; 
	insert into log(id_usuario,nombre,log,estatus)
        values(id_usuario_param,nombre_param,log_param,estatus_param);			
	RETURN;		
END;
$$ 
