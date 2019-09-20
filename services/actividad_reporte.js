
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
//const helperToken = require('../helpers/helperTokenMovil');
const {validarToken} = require('../helpers/helperTokenMovil');

const getActividadesRelacionadosFamiliar = (request, response) => {
    console.log("@getActividadesPorAlumno");
    try {
        //validarToken(request,response);
       
        const id_familiar = request.params.id_familiar;

        pool.query(
            `           
        select  r.fecha,
            date_trunc('minute',r.fecha+r.hora) as hora,
            date_trunc('minute',r.fecha+r.hora)::text as fecha_hora_text,
            ac.nombre as actividad,
            ac.icono as icono,
            tipo.nombre as tipo_actividad,
            sub.nombre as sub_actividad,
            r.nota,
            a.nombre as nombre_alumno,
            a.apellidos as apellidos_alumno,
            r.url_foto,
            r.id
            from co_registro_actividad r inner join cat_actividad ac on r.cat_actividad = ac.id 
                     left join cat_tipo_actividad tipo on r.cat_tipo_actividad = tipo.id
                    left join cat_sub_actividad sub on r.cat_sub_actividad = sub.id
                    inner join co_alumno a on r.co_alumno = a.id
            where co_alumno IN
                (select co_alumno from co_alumno_familiar where co_familiar = $1 and eliminado = false) 
                and a.eliminado = false
                and fecha = getDate('')
            order by r.fecha,r.hora desc
            `, [id_familiar],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                respuesta.respuesta = results.rows;
                response.status(respuesta.statusNumber).json(respuesta);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getCargosAlumnosFamiliar = (request, response) => {
    console.log("@getCargosFamiliarAlumnos");
    try {

        validarToken(request,response);
        /*
        var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }*/

        var id_familiar = request.params.id_familiar;

        pool.query(
            `
             
                SELECT a.co_balance_alumno,
  			        a.id as id_alumno,
  			        a.nombre as nombre_alumno,  			
                    b.id as id_cargo_balance_alumno,
                    b.fecha::text,
                    b.cantidad,
                    cargo.nombre as nombre_cargo,
                    cat_cargo as id_cargo,
                    cargo.es_facturable,
                    b.total as total,
                    b.cargo,
                    b.total_pagado,
                    b.nota,
                    b.pagado ,
                    false as checked ,
                    0 as pago               
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id			
             WHERE a.id 
                        IN
             			(select co_alumno from co_alumno_familiar where co_familiar = $1 and eliminado = false)              		             		             		
                 		--and (to_char(b.fecha,'YYYYMM') = to_char(current_date,'YYYYMM') or pagado = false)             		             		
                 		and b.eliminado = false and a.eliminado = false
              ORDER by b.pagado,cargo.nombre,a.nombre, b.fecha desc
             LIMIT 100
                `,
            [id_familiar],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                console.log("====> " + JSON.stringify(results.rows));
                respuesta.respuesta = results.rows;
                response.status(respuesta.statusNumber).json(respuesta);
                //response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getCargosPagadosAlumnosFamiliar = (request, response) => {
    console.log("@getCargosPagadosAlumnosFamiliar");
    try {

        validarToken(request,response);
        /*
        var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }*/

        var id_familiar = request.params.id_familiar;

        pool.query(
            `
                SELECT a.co_balance_alumno,
  			        a.id as id_alumno,
  			        a.nombre as nombre_alumno,  			
                    b.id as id_cargo_balance_alumno,
                    b.fecha,
                    b.cantidad,
                    cargo.nombre as nombre_cargo,
                    cat_cargo as id_cargo,
                    cargo.es_facturable,
                    b.total as total,
                    b.cargo,
                    b.total_pagado,
                    b.nota,
                    b.pagado ,
                    false as checked ,
                    0 as pago               
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id			
             WHERE a.id in
             			(select co_alumno from co_alumno_familiar where co_familiar = $1 and eliminado = false)              		             		             		
                 		and to_char(b.fecha,'YYYYMM') = to_char(current_date,'YYYYMM') 
             		    and pagado = true
                 		and b.eliminado = false and a.eliminado = false
              ORDER by b.pagado,cargo.nombre,a.nombre, b.fecha desc
             LIMIT 20
                `,
            [id_familiar],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                console.log("====> " + JSON.stringify(results.rows));

                //response.status(200).json(results.rows);
                respuesta.respuesta = results.rows;
                response.status(respuesta.statusNumber).json(respuesta);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getBalanceFamiliarAlumnos = (request, response) => {
    console.log("@getBalanceFamiliarAlumnos");
    try {
        validarToken(request,response);
        /*
        var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }*/

        var id_familiar = request.params.id_familiar;

        pool.query(
            `
            with cargos as (
                SELECT a.co_balance_alumno,
                         a.id as id_alumno,
                         split_part(a.nombre,' ', 1) as nombre_alumno, 
                           b.id as id_cargo_balance_alumno,
                           b.fecha::text,
                           b.cantidad,
                           cargo.nombre as nombre_cargo,
                           cat_cargo as id_cargo,
                           cargo.es_facturable,
                           b.total as total,
                           b.cargo,
                           b.total_pagado,
                           b.nota,
                           b.pagado ,
                           false as checked ,
                           0 as pago               
                FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                              inner join cat_cargo cargo on b.cat_cargo = cargo.id			
                WHERE a.id 
                            in
                            (select co_alumno from co_alumno_familiar where co_familiar = $1 and eliminado = false)              		             		             		                 		
                            and b.eliminado = false and a.eliminado = false
                 ORDER by b.fecha,b.pagado,cargo.nombre,a.nombre desc             
                 LIMIT 50
            ) select (c.fecha::date)::text,array_to_json(array_agg(to_json(c.*))) as array_cargos
              from cargos c
              group by c.fecha::date
			  order by c.fecha::date DESC`,
            [id_familiar],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {
                    respuesta.respuesta = results.rows;
                    response.status(respuesta.statusNumber).json(respuesta);

                } else {
                    console.log("No existe balance para el alumno " + id_alumno);                 
                    respuesta.respuesta = [];
                    response.status(respuesta.statusNumber).json(respuesta);
                }

                //response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const updateTokenMensajeriaFamiliar = (request, response) => {
    console.log("@updateTokenMensajeriaFamiliar");
    try {
        validarToken(request,response);
        /*
        var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }*/

        var id_familiar = request.params.id_familiar;

        const { token } = request.body;

        pool.query(
            ` UPDATE co_familiar SET 
                  token = $2, 
                  fecha_modifico = (getDate('')+getHora(''))::timestamp
                  WHERE id = $1 `,
            [
                id_familiar, token
            ],
            (error, results) => {
                if (error) {
                    console.log("Error al actualizar el token del  familiar " + error);
                    handle.callbackError(error, response);
                    return;
                }
                respuesta.respuesta = true;
                response.status(respuesta.statusNumber).json(respuesta);

                //response.status(200).send({ operacion: true });
            });

    } catch (e) {
        console.log("Error al actualizar el token familiar " + e);
        handle.callbackErrorNoControlado(e, response);
    }
}


const updateDatosFamiliar = (request, response) => {
    console.log("@updateDatosFamilia");
    try {
        validarToken(request,response);

        /*var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }*/

        var id_familiar = request.params.id_familiar;

        const { nombre, telefono, fecha_nacimiento, correo, celular, religion } = request.body;

        console.log("id_familiar " + id_familiar);

        console.log("nom = " + nombre
            + " Tel = " + telefono
            + " fecha = " + fecha_nacimiento
            + " correo = " + correo
            + " Cel = " + celular
            + " Relig= " + religion);

        var sqlUpdateConCambioPassword =
            "UPDATE co_familiar SET " +
            " nombre = $2, telefono = $3,fecha_nacimiento = $4,correo=$5,celular = $6,religion = $7," +
            " fecha_modifico = (getDate('')+getHora(''))::timestamp" +
            " WHERE id = $1";

        console.log("SQL " + sqlUpdateConCambioPassword);
        pool.query(sqlUpdateConCambioPassword,
            [id_familiar, nombre, telefono, fecha_nacimiento, correo, celular, religion],
            (error, results) => {
                if (error) {
                    console.log("Error al actualizar los datos del  familiar " + error);
                    handle.callbackError(error, response);
                    return;
                }
                console.log("Se actualizaron los datos del familiar");
                //response.status(200).send(id_familiar);
                respuesta.respuesta = id_familiar;
                response.status(respuesta.statusNumber).json(respuesta);
            });

    } catch (e) {
        console.log("Error al actualizar los datos del familiar " + e);
        handle.callbackErrorNoControlado(e, response);
    }
}


module.exports = {
    getActividadesRelacionadosFamiliar,
    getCargosAlumnosFamiliar,
    getCargosPagadosAlumnosFamiliar,
    getBalanceFamiliarAlumnos,
    updateTokenMensajeriaFamiliar,
    updateDatosFamiliar
}