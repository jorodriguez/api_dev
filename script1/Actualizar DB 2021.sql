do
$$
DECLARE 
	alumno_loop RECORD;
	countTotalTuplas integer := 0;
	ANIO_CURSO text := '';
	dias_no_eliminar_asistencia_alumno integer := 10;
	dias_no_eliminar_asistencia_usuario integer := 60;
	dias_no_eliminar_gastos integer := 10;
	dias_no_eliminar_pago integer := 20;
	_loop RECORD;
BEGIN  

	    raise notice 'Reduciendo la db "%"',current_database();
		SELECT sum(n_live_tup) FROM pg_stat_user_tables INTO countTotalTuplas;
		raise notice 'Total de tuplas % /n',countTotalTuplas;
		
		raise notice 'Configurando timezone Actualmente esta en ...';		
		--show timezone;	 
		SET TIME ZONE 'Mexico/General';
		
		raise notice 'Eliminando tokens de telefonos..';
		update co_familiar 
		SET token = (select token from co_familiar where id=54)			
		where token is not null and token <> 'joel.rod.roj@hotmail.com';
		
		raise notice 'Actualizando correos de familiares..';
		update co_familiar 
		set correo = 'joel@magicintelligence.com' where correo not in ('joel.rod.roj@hotmail.com');

		raise notice 'Actualizando correos de copias de notificacion ..';
		update co_correo_copia_notificacion set correo = 'velocirraptor79.1@gmail.com';
		
		raise notice 'Eliminando logicamente usuario_notificacion ..';
		update co_usuario_notificacion set eliminado = true;
		
		raise notice '--> Horas extras';
		delete from co_hora_extra;
				
		raise notice 'x x x x x ELIMINACION FISICA x x x x';
		--select to_char(current_date,'YY') INTO ANIO_CURSO;
		raise notice 'asistencias de alumnos, solo se deja los ultimos % dias ',dias_no_eliminar_asistencia_alumno;		
		--delete from co_asistencia where to_char(fecha,'YY') = ANIO_CURSO;	
		delete from co_asistencia  where fecha::date <= getDate('') - dias_no_eliminar_asistencia_alumno;
		
		raise notice '--> LOGS';
		delete from log;		
		
		raise notice '--> Notificaciones';
		delete from si_notificacion;		
				
		raise notice 'asistencias de usuarios, solo se deja los ultimos % dias ',dias_no_eliminar_asistencia_usuario;		
		delete from co_asistencia_usuario where fecha <= (getDate('') - dias_no_eliminar_asistencia_usuario); 

		raise notice '--> registros de emociones';
		delete from co_emocion_actividad;
		
		raise notice 'asistencias de usuarios, solo se deja los ultimos % dias ',dias_no_eliminar_gastos;		
		delete from co_gasto where fecha <=  (getDate('') - dias_no_eliminar_gastos); 
		
		raise notice 'Actualizando los password de los usuarios a 123';
		update usuario set password = '$2a$08$XOjFNU1bEQ4YjNm0/jfvJO4CVbqYKy/DZV0B1QtWuwWFcnh2bmKOC';
		
		raise notice ' == Eliminando relacion pago-cargo, solo dejar los ultimos % dias',dias_no_eliminar_pago;
		delete from co_pago_cargo_balance_alumno where fecha::date <= getDate('') - dias_no_eliminar_pago;		
		
		raise notice ' == Eliminando pagos, solo dejar los ultimo % días',ANIO_CURSO;
		delete from co_pago_balance_alumno where fecha::date <= getDate('') - dias_no_eliminar_pago;				
		
			
		FOR _loop IN ( 
				SELECT schemaname,relname as tabla,n_live_tup AS total_tuplas FROM pg_stat_user_tables ORDER BY n_live_tup DESC
		) LOOP 
			raise notice '% -> % registros',_loop.tabla,_loop.total_tuplas;								
		END LOOP; 	
		
	
	    SELECT sum(n_live_tup) FROM pg_stat_user_tables INTO countTotalTuplas;
		raise notice '===== Total de tuplas restantes  %  /n=======',countTotalTuplas;
		
		 
END;
$$
LANGUAGE plpgsql;
--LANGUAGE 'plpgsql';




