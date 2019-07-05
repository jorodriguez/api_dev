
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria  = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});




const getFormasPago = (request, response) => {
    console.log("@getFormasPago");
    try {
/*
        var validacion = helperToken.validarToken(request);

        if(!validacion.tokenValido){
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }*/
        
        pool.query("SELECT * FROM CO_FORMA_PAGO WHERE ELIMINADO = FALSE",
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
    getFormasPago 
}