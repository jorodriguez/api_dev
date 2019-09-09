
const Pool = require('pg').Pool
const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const config = require('../config/config');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getConfiguracion = (request, response) => {
    console.log("@getConfiguracion");
    try {
        var validacion = helperToken.validarToken(request);

        if(!validacion.tokenValido){
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
        pool.query("select * from configuracion WHERE id = 1",
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                let conf =null;
                if(results.rowCount > 0){
                    conf = results.rows[0];
                }
                response.status(200).json(conf);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getConfiguracion    
}