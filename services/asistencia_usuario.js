
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
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

        pool.query(SQL_USUARIOS_POR_ENTRAR, [id_sucursal,id_sucursal],
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
        
        const { id,comentario_entrada='', genero } = request.body;
        console.log("Ids registrar entrada  " + id);

        pool.query(`
                INSERT INTO CO_ASISTENCIA_USUARIO(fecha,hora_entrada,usuario,comentario_entrada,genero)
                values(getDate(''),(getDate('')+getHora('')),$1,$2,$3) RETURNING hora_entrada;
        `,[id,comentario_entrada,genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log(""+JSON.stringify(results));

                let respuesta = null;

                if(results.rowCount > 0){
                    respuesta = {
                        registrado:(results.rowCount > 0),
                        hora_entrada : results.rows[0].hora_entrada
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
        
        const { id_asistencia,comentario_salida='', genero } = request.body;

        pool.query(`
            update CO_ASISTENCIA_USUARIO
                SET hora_salida = (getDate('')+getHora('')),
                    comentario_salida =$2,
                    modifico = $3            
            WHERE id = $1 
            RETURNING hora_salida;
        
        `,[id_asistencia,comentario_salida,genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                let respuesta = null;

                if(results.rowCount > 0){
                    respuesta = {
                        registrado:(results.rowCount > 0),
                        hora_salida : results.rows[0].hora_salida
                    };
                }    
                response.status(200).json(respuesta);
            });
    

        } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


//lista simple
/*
const getListaAsistenciaUsuarios = (request, response) => {
    console.log("@getListaAsistenciaUsuarios");

    const { id_sucursal, fecha } = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha);
    try {
        pool.query(`        `, [id_sucursal, new Date(fecha)]).then((results) => {
            console.log("resultado lista de asistencia");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}
*/



module.exports = {
    getListaUsuarioPorEntrar,
    getListaUsuarioPorSalir,
    registrarEntradaUsuario,
    registrarSalidaUsuario
}
