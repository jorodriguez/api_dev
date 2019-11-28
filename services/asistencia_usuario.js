
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const { TIPO_USUARIO,ID_EMPRESA_MAGIC } = require('../utils/Constantes');
//const mensajeria = require('./mensajesFirebase');


//FIXME : agregar el parametro de fecha
const SQL_USUARIO_POR_SALIR =
    `
    select a.id,
	    tipo.id as id_tipo_usuario,
	    tipo.nombre as tipo_usuario,
	    tipo.prefijo,
	    u.id as id_usuario,
	    u.nombre,
	    u.correo,	
	    suc.nombre as nombre_sucursal,	
	    u.permiso_gerente,
	    u.hora_entrada,
        u.hora_salida,
        date_trunc('minutes',a.hora_entrada::time)::text as hora_asistencia_entrada,
         date_trunc('minutes',a.hora_salida::time)::text as hora_asistencia_salida,
        u.minutos_gracia_entrada,
        u.foto
    from co_asistencia_usuario a inner join usuario u on u.id = a.usuario
				inner join cat_tipo_usuario tipo on tipo.id = u.cat_tipo_usuario
				inner join co_sucursal suc on suc.id = u.co_sucursal
    where u.co_sucursal = $1 
            and u.eliminado = false
            and fecha = getDate('')
    order by u.nombre asc
    `
    ;

const SQL_USUARIOS_POR_ENTRAR =
    `
    select 
        tipo.id as id_tipo_usuario,
        tipo.nombre as tipo_usuario,
        tipo.prefijo,
        u.id,
        u.nombre,
        u.correo,
        u.password,
        suc.nombre as nombre_sucursal,
        u.token,
        u.permiso_gerente,
        u.hora_entrada,
        u.hora_salida,
        u.minutos_gracia_entrada	
        from usuario u inner join cat_tipo_usuario tipo on tipo.id = u.cat_tipo_usuario
        inner join co_sucursal suc on suc.id = u.co_sucursal
where u.co_sucursal = $1	
    and tipo.id = 1
    and u.id not in  (
        select usuario
		from co_asistencia_usuario a inner join usuario u on u.id = a.usuario 
		where u.co_sucursal = $2
			and a.fecha = getDate('') 
			and a.eliminado = false      
			and u.eliminado = false
    )	
and u.eliminado = false
order by u.nombre asc
    `
    ;


const getListaUsuarioPorEntrar = (request, response) => {
    console.log("@getListaUsuarioPorEntrar");
    try {

        console.log("Iniciando consulta de usuarios por entrar ");

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query(SQL_USUARIOS_POR_ENTRAR, [id_sucursal, id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getListaUsuarioPorSalir = (request, response) => {
    console.log("@getListaUsuarioPorSalir");
    try {

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query(SQL_USUARIO_POR_SALIR,
            [id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const registrarEntradaUsuario = (request, response) => {
    console.log("@registrarEntradaUsuario");
    try {

        const { id, comentario_entrada = '', genero } = request.body;
        console.log("Ids registrar entrada  " + id);

        pool.query(`
                INSERT INTO CO_ASISTENCIA_USUARIO(fecha,hora_entrada,usuario,comentario_entrada,genero)
                values(getDate(''),(getDate('')+getHora('')),$1,$2,$3) RETURNING hora_entrada;
        `, [id, comentario_entrada, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log("" + JSON.stringify(results));

                let respuesta = null;

                if (results.rowCount > 0) {
                    respuesta = {
                        registrado: (results.rowCount > 0),
                        hora_entrada: results.rows[0].hora_entrada
                    };
                }
                response.status(200).json(respuesta);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const registrarSalidaUsuario = (request, response) => {
    console.log("@registrarSalidaUsuario");

    try {

        const { id_asistencia, comentario_salida = '', genero } = request.body;

        pool.query(`
            update CO_ASISTENCIA_USUARIO
                SET hora_salida = (getDate('')+getHora('')),
                    comentario_salida =$2,
                    modifico = $3            
            WHERE id = $1 
            RETURNING hora_salida;
        
        `, [id_asistencia, comentario_salida, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                let respuesta = null;

                if (results.rowCount > 0) {
                    respuesta = {
                        registrado: (results.rowCount > 0),
                        hora_salida: results.rows[0].hora_salida
                    };
                }
                response.status(200).json(respuesta);
            });


    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


//Lista de faltas por rango de fecha y sucursal
//FIXME: el id de la empresa debe de enviarse por parametro
const getListaFaltasUsuariosSucursalRangoFecha = (request, response) => {
    console.log("@getListaAsistenciaUsuarios");

    const { id_sucursal, fecha_inicio,fecha_fin,id_empresa} = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha_inicio + " fecha fin "+fecha_fin);

    try {
        pool.query(` 
        with dias_activos_trabajados AS(		
            SELECT count(*) as dias_trabajo			  
            FROM  generate_series($3::date,$4::date,'1 day')  g
            WHERE g::date not in (select fecha 
                                    from cat_dias_asueto 
                                    where cat_empresa = $5 
                                        and fecha between $3::date  and $4::date
                                        and activo=true 
                                        and eliminado = false)
                  and to_char(g::date,'d')::int not in (1,7)
        ) select 
            u.id,
            u.nombre as usuario,
            count(au.id) as count_dias_asistencia,
            d.dias_trabajo - count(au.id) as count_dias_faltas,
            d.dias_trabajo 
        from dias_activos_trabajados d, usuario u left join co_asistencia_usuario au on au.usuario = u.id 
                                                and au.fecha between $3::date  and $4::date
        where u.co_sucursal = $1 and u.cat_tipo_usuario = $4 and u.eliminado = false		  
            group by u.id,d.dias_trabajo
            order by u.nombre
     `, [id_sucursal, 
            TIPO_USUARIO.MAESTRA,
            new Date(fecha_inicio),
            new Date(fecha_fin)],
            (id_empresa || ID_EMPRESA_MAGIC)
            ).then((results) => {
            console.log("resultado lista de faltas por maestros");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

const getDetalleFaltasUsuariosRangoFecha = (request, response) => {
    console.log("@getDetalleFaltasUsuariosRangoFecha");

    const { id_usuario, fecha_inicio,fecha_fin } = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha_inicio + " fecha fin "+fecha_fin);

    try {
        pool.query(` 
        with asistencia_usuario as(
			select au.*
			from co_asistencia_usuario au 
			where  au.fecha between $2::date  and $3::date 				
					and au.usuario = $1
					and au.eliminado = false
		) SELECT g::date as fecha,dias_asuetos.fecha is not null as dia_asueto,au.*
		FROM  generate_series($2::date,$3::date,'1 day')  g left join asistencia_usuario au on au.fecha = g::date																				
							left join (select fecha 
										from cat_dias_asueto 
										where cat_empresa =  $4
												and fecha between $2::date  and $3::date
												and activo=true 
											and eliminado = false)	
											dias_asuetos on dias_asuetos.fecha = g::date
		WHERE to_char(g::date,'d')::int not in (1,7)
     `, [id_usuario,             
            new Date(fecha_inicio),
            new Date(fecha_fin),
            (id_empresa || ID_EMPRESA_MAGIC)
        ]
            ).then((results) => {
            console.log("detalle de faltas ");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}




module.exports = {
    getListaUsuarioPorEntrar,
    getListaUsuarioPorSalir,
    registrarEntradaUsuario,
    registrarSalidaUsuario,
    getListaFaltasUsuariosSucursalRangoFecha,
    getDetalleFaltasUsuariosRangoFecha
}
