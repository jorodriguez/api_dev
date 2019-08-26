
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const Joi = require('@hapi/joi');

const config = require('../config/config');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getMesesActivos = (request, response) => {
    console.log("@getMeses");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(" with universo AS(" +
            " select generate_series((select min(fecha) from co_cargo_balance_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha" +
            "   ) select u.fecha::date," +
            "           extract(month from u.fecha) as numero_mes," +
            "           extract(year from u.fecha) as numero_anio," +
            "           to_char(u.fecha,'Mon') as nombre_mes" +
            "   from universo u ",
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




//buscar un correo de papa repetidos

//const findCorreoPadre = (request, response) => {
const findCorreoPadre = (correo) => {
    console.log("@findCorreoPapa");

    return new Promise((resolve, reject) => {
        pool.query(
            `
                SELECT 
                    CASE WHEN 
                            EXISTS (
                                SELECT true 
                                FROM co_familiar f 
                                WHERE f.correo = $1
                                    AND f.eliminado = false
                                )
                        THEN true
                        ELSE false
                    END AS encontrado
                `, [correo],
            (error, results) => {
                if (error) {
                    console.log("Error al buscar el correo del familiar " + e);
                    reject(error);
                }
                
                if (results.rowCount > 0) {
                    console.log(" Correo de papa encontrado ");                    
                    console.log("==== " + JSON.stringify(results.rows[0]));
                    let encontrado = results.rows[0].encontrado;

                    resolve(encontrado);

                }                
            });
    });

};




module.exports = {
    getMesesActivos,
    findCorreoPadre
}