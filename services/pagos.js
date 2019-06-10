

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

//  agregar_cargo_alumno(IN id_alumno integer, id_cargo integer ,cantidad integer ,nota text ,id_genero integer,OUT retorno boolean) AS $$

//registrar pagos
const registrarCargo = (request, response) => {
    console.log("@registrarCargo");
    try {
  /*      var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
*/
        const { id_alumno,id_cargo,cantidad,nota,genero } = request.body;

        console.log("=====>> "+JSON.stringify(request.body));
                   
        pool.query("select agregar_cargo_alumno($1,$2,$3,$4,$5,$6);",                               
            [id_alumno,id_cargo,cantidad,nota,genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }                
                console.log("Se llamo a la function de cargo ");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                //buscar el padre y enviarle la notificacion y el correo del registro del pago
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
        
    }
};


//agregar_pago_alumno(IN id_alumno integer,pago_param numeric ,nota text ,id_genero integer,OUT retorno boolean) 
//registrar pagos
const registrarPago = (request, response) => {
    console.log("@registrarPago");
    try {
  /*      var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
*/
        const { id_alumno,pago,nota,genero } = request.body;

        console.log("=====>> "+JSON.stringify(request.body));
                   
        pool.query("select agregar_pago_alumno($1,$2,$3,$4);",                               
            [id_alumno ,pago,nota,genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }                
                console.log("Se llamo a la function de pago");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
        
    }
};



const getCatalogoCargos = (request, response) => {
    console.log("@getCatalogoCargos");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            "SELECT * from cat_cargo where eliminado = false order by nombre",
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


const getCargosAlumno = (request, response) => {
    console.log("@getCargosAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            " select b.* "+
            " from co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno" +
            " where a.id = $1 and b.eliminado = false and a.eliminado = false ",
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


const getPagosAlumno = (request, response) => {
    console.log("@getPagosAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            " select * "+
            " from co_pago_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno"+
            " where a.id = $1 and b.eliminado = false and a.eliminado = false  ",+
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


module.exports = {
    registrarPago,
    registrarCargo,
    getCatalogoCargos
    
}