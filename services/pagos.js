

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

/*

--registrar un cargo : agregar_cargo_alumno(IN id_balance integer, id_alumno integer,id_cargo integer ,cantidad integer ,nota text ,id_genero integer);
select agregar_cargo_alumno(53,62,3,1,'test de cargo',1);

--registrar un pago : agregar_pago_alumno(IN id_balance integer,pago_param numeric ,nota text ,id_genero integer,OUT retorno boolean) AS $$
select agregar_pago_alumno(53,50,'sin nota'
*/

//registrar pagos
const registrarPago = (request, response) => {
    console.log("@registrarPago");
    try {
  /*      var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
*/
        const { id_balance,id_alumno,id_cargo,cantidad,nota,genero } = request.body;


        console.log("=====>> "+JSON.stringify(request.body));
                   
        pool.query("select agregar_cargo_alumno($1,$2,$3,$4,$5,$6);",                               
            [53,62,3,1,'test desde param',1],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }                
                console.log("Se llamo a la function");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
        
    }
};


module.exports = {
    registrarPago
    
}