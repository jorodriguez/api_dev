

	select * from usuario

	--sucursales
	--3 contry
	
	--sonreir328
	--enc : $2a$08$wltCqTSQzfEbBFTFsdb3c..D5.0u5DfmBUQnM9iWahFm3RmSwLSqK
	insert into usuario(nombre,correo,co_sucursal,password,permiso_gerente,cat_tipo_usuario,hora_entrada,hora_salida,genero,sueldo_mensual,sueldo_quincenal)
	values('Miss Sofía','sofia@magicintelligence.com',3,'$2a$08$wltCqTSQzfEbBFTFsdb3c..D5.0u5DfmBUQnM9iWahFm3RmSwLSqK',false,1,'08:00:00','20:00:00',1,1,1)
	returning id;
	--263

	--aventura37
	insert into usuario(nombre,correo,co_sucursal,password,permiso_gerente,cat_tipo_usuario,hora_entrada,hora_salida,genero,sueldo_mensual,sueldo_quincenal)
	values('Miss Jackelin','jackelin@magicintelligence.com',3,'$2a$08$Myv1saKLdHbsZeIblrlqa.ys/6AUsdHetwg1zODztCXIFjuwCUub2',false,2,'08:00:00','20:00:00',1,1,1)
	returning id;
	--264


//para activar un usuario como coordinador 
1. dar de alta en el sistema
2. correr el comando

update usuario
set acceso_sistema = true,
co_empresa = 1
where id in (263,264)	


//activar roles para administrar usuario
select * from si_rol where id in (3,1)
insert into si_usuario_sucursal_rol(usuario,co_sucursal,si_rol,co_empresa,genero)
values(263,3,1,1,1),(263,3,3,1,1);
