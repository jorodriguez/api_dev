

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
        const { id_alumno,cat_cargo,cantidad,nota,genero } = request.body;

        console.log("=====>> "+JSON.stringify(request.body));
        //select agregar_cargo_alumno(62, 2 ,1 ,'hhhhh' ,1);
        pool.query("select agregar_cargo_alumno($1,$2,$3,$4,$5);",                               
            [id_alumno,cat_cargo,cantidad,nota,genero],
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

        console.log("request.params.id_alumno "+request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

          /*" select cargo.nombre as nombre_cargo,b.* "+
            " from co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno" +
            "                               inner join cat_cargo cargo on b.cat_cargo = cargo.id"+
            " where a.id = $1 and b.eliminado = false and a.eliminado = false ",*/

        pool.query(          
            " select a.co_balance_alumno,b.fecha,b.cantidad,cargo.nombre as nombre_cargo,cat_cargo as id_cargo,b.total as total,b.nota,'cargo' as tipo"+
            " from co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno "+
            "                               inner join cat_cargo cargo on b.cat_cargo = cargo.id"+
            " where a.id = $1 and b.eliminado = false and a.eliminado = false"+
            " union all		"+
            " select a.co_balance_alumno,b.fecha,null as cantidad,'pago' as nombre_cargo,null as id_cargo,b.pago as total,b.nota,'pago' as tipo"+
            " from co_pago_balance_alumno b	inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno	"+				
            " where a.id = $2 and b.eliminado = false and a.eliminado = false",
            [id_alumno,id_alumno],
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


const getBalanceAlumno = (request, response) => {
    console.log("@getBalanceAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("request.params.id_alumno "+request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

        pool.query(
            " SELECT al.nombre as nombre_alumno,al.apellidos as apellidos_alumno, bal.* "+
			" FROM co_alumno al inner join  co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false"+
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
                    console.log("No existe balance para el alumno "+id_alumno);

                    response.status(200).json({});
                }

                //response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    registrarPago,
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno
    
}