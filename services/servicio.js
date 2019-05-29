
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

//obtener actividades

const getCatalogoServicios = (request, response) => {

    console.log("@getCatalogoServicios");

    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            "SELECT * from cat_servicio where eliminado = false order by nombre",
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


const getServiciosAlumno = (request, response) => {
    console.log("@getServiciosAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_alumno = request.body.id_alumno;

        pool.query(
            "	SELECT rel.id as id_relacion," +
            "       rel.co_alumno,          " +
            "       rel.cantidad,          " +
            "       rel.fecha,          " +
            "       ser.*                   " +
            "   FROM co_alumno_servicio rel inner join cat_servicio ser on rel.cat_servicio = ser.id" +
            "   WHERE rel.co_alumno = $1 AND rel.eliminado = false",
            [id_alumno],
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


const registrarServicio = (request, response) => {
    console.log("@registrarServicio");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { co_alumno, cat_servicio, cantidad, genero } = request.body;

        console.log("=====>> " + JSON.stringify(request.body));

        pool.query("INSERT INTO co_alumno_servicio(fecha,co_alumno,cat_servicio,cantidad,genero)" +
            " values(current_date,$1,$2,$3,$4) RETURNING id;",
            [co_alumno, cat_servicio, cantidad, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                if (results.rowCount > 0) {

                    response.status(200).json(results.rows[0].id);
                }
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


module.exports = {
    getCatalogoServicios,
    getServiciosAlumno,
    registrarServicio
}
