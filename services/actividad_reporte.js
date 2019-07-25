
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperTokenMovil');
const mensajeria = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getActividadesRelacionadosFamiliar = (request, response) => {
    console.log("@getActividadesPorAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_familiar = request.params.id_familiar;

        pool.query(
            `           
        select  r.fecha,
            date_trunc('minute',r.fecha+r.hora) as hora,
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
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getCargosAlumnosFamiliar = (request, response) => {
    console.log("@getCargosFamiliarAlumnos");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }


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

                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getCargosPagadosAlumnosFamiliar = (request, response) => {
    console.log("@getCargosPagadosAlumnosFamiliar");
    try {
        
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }


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

                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getBalanceFamiliarAlumnos = (request, response) => {
    console.log("@getBalanceFamiliarAlumnos");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
        var id_familiar = request.params.id_familiar;

        pool.query(
            `
             SELECT al.nombre as nombre_alumno,al.apellidos as apellidos_alumno, bal.* 
             FROM co_alumno al inner join  co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false
             WHERE al.id IN 
                        (select co_alumno from co_alumno_familiar where co_familiar = $1 and eliminado = false)
                and al.eliminado = false `,
            [id_familiar],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {

                    //let balance_alumno = results.rows[0];

                    response.status(200).json(results.rows);

                } else {
                    console.log("No existe balance para el alumno " + id_alumno);

                    response.status(200).json({});
                }

                //response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getActividadesRelacionadosFamiliar,
    getCargosAlumnosFamiliar,
    getCargosPagadosAlumnosFamiliar,
    getBalanceFamiliarAlumnos
}