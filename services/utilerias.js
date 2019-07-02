
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

module.exports = {
    getMesesActivos
}