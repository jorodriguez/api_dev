
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');

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