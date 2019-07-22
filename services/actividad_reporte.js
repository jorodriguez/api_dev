
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getActividadesPorAlumno = (request, response) => {
    console.log("@getActividadesPorAlumno");
    try {
        /*var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }*/
        //agregar el parametro del padre

        const id_alumno = request.params.id_alumno;

        pool.query(
            `
            select  r.fecha,
            date_trunc('minute', r.hora) as hora,
		ac.nombre as actividad,
        tipo.nombre as tipo_actividad,
		sub.nombre as sub_actividad,
		r.nota,
		a.nombre as nombre_alumno,
		a.apellidos as apellidos_alumno,
		r.url_foto,
		r.*
from co_registro_actividad r inner join cat_actividad ac on r.cat_actividad = ac.id 
							left join cat_tipo_actividad tipo on r.cat_tipo_actividad = tipo.id
							 left join cat_sub_actividad sub on r.cat_sub_actividad = sub.id
							 inner join co_alumno a on r.co_alumno = a.id
where co_alumno = $1 and fecha = getDate('')
order by r.fecha,r.hora desc
            `,[id_alumno],
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

//se pone este query pero se quitara cuando ya tenga el login
const getCargosAlumnoTemp = (request, response) => {
    console.log("@getCargosAlumnoTemp");
    try {

        var id_alumno = request.params.id_alumno;

        pool.query(
            " SELECT a.co_balance_alumno," +
            "   b.id as id_cargo_balance_alumno," +
            "   b.fecha," +
            "   b.cantidad," +
            "   cargo.nombre as nombre_cargo," +
            "   cat_cargo as id_cargo," +
            "   cargo.es_facturable," +
            "   b.total as total," +
            "   b.cargo," +
            "   b.total_pagado," +
            "   b.nota," +
            "   b.pagado ," +
            "   false as checked ," +
            "   0 as pago " +
            " FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno " +
            "                               inner join cat_cargo cargo on b.cat_cargo = cargo.id					" +
            " WHERE a.id = $1 and b.eliminado = false and a.eliminado = false" +
            "  ORDER by b.pagado, b.fecha desc" +
            " LIMIT 20",
            [id_alumno],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                
                console.log("====> "+JSON.stringify(results.rows));

                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getBalanceAlumnoTemp = (request, response) => {
    console.log("@getBalanceAlumnoTemp");
    try {
        /*      var validacion = helperToken.validarToken(request);
      
              if (!validacion.tokenValido) {
                  return response.status(validacion.status).send(validacion.mensajeRetorno);;
              }
      */
        console.log("request.params.id_alumno " + request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

        pool.query(
            " SELECT al.nombre as nombre_alumno,al.apellidos as apellidos_alumno, bal.* " +
            " FROM co_alumno al inner join  co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false" +
            " WHERE al.id = $1 and al.eliminado = false ",
            [id_alumno],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {

                    let balance_alumno = results.rows[0];

                    response.status(200).json(balance_alumno);

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
    getActividadesPorAlumno,
    getCargosAlumnoTemp,
    getBalanceAlumnoTemp
}