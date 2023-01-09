--cargar nueva sucursal para cobro por horas
insert into co_sucursal(id,nombre,direccion,class_color,co_empresa, foto,genero) values(4,'NUEVO','','red',1,'',1);

insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
valueS(12,4,1,1,1),
	 (12,4,2,1,1),
	 (12,4,3,1,1),
	 (12,4,4,1,1),
	 (12,4,5,1,1);



insert into co_grupo(nombre,color,genero) values('COBRANZA POR HORA','#174CD1',1);




