

const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const { QUERY,getCatalogo } = require('./catagolosHelper');

const notificacionService = require('../utils/NotificacionService');

//registrar pagos
const registrarCargo = (request, response) => {
    console.log("@registrarCargo");
    try {
       // validarToken(request,response);        

        const { id_alumno, cat_cargo, cantidad, nota, genero } = request.body;
              
        console.log("=====>> " + JSON.stringify(request.body));
                
        pool.query("select agregar_cargo_alumno($1,$2,$3,$4,$5);",
            [id_alumno, cat_cargo.id, cantidad, nota, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log("Se llamo a la function de cargo ");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                //buscar el padre y enviarle la notificacion y el correo del registro del pago
                if(results.rowCount > 0){
                    let id_cargo_generado = results.rows[0].id;
                    response.status(200).json(results.rowCount)
                }                
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
        //validarToken(request,response);        

        console.log("=====>> " + JSON.stringify(request.body));
        const { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago,identificador_factura, genero } = request.body;

        console.log("SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'"+identificador_factura+"',"+ genero + " )");        
       
        pool.query("SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'"+identificador_factura+"',"+ genero + " );",            
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if(results.rowCount > 0){
                    let retorno = results.rows[0];
                    console.log("Retorno el ID "+ JSON.stringify(results.rows));
                    notificacionService.notificarReciboPago(id_alumno,retorno.agregar_pago_alumno);                       
                }         
                
                response.status(200).json(results.rowCount);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const getCatalogoCargos = (request, response) => {
    console.log("@getCatalogoCargos");
    getCatalogo(QUERY.CARGOS,request,response);   
};


const getCargosAlumno = (request, response) => {
    console.log("@getCargosAlumno");
    try {
        //validarToken(request,response);        

        console.log("request.params.id_alumno " + request.params.id_alumno);

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
                
                //console.log("====> "+JSON.stringify(results.rows));

                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getPagosByCargoId = (request, response) => {
    console.log("@getPagosByCargoId");
    try {
        //validarToken(request,response);        

        console.log("request.params.id_cargo_balance_alumno " + request.params.id_cargo_balance_alumno);

        var id_cargo_balance_alumno = request.params.id_cargo_balance_alumno;

        pool.query(
              ` 	
              SELECT forma_pago.id as id_forma_pago,
                    forma_pago.nombre as nombre_forma_pago,
                    pago.identificador_factura ,r.*
               FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                   inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
               WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
               ORDER BY pago.fecha DESC`,
            [id_cargo_balance_alumno],
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
        
        //validarToken(request,response);        

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



const eliminarCargos = (request, response) => {
    console.log("@eliminarCargos");
    try {
        //validarToken(request,response);        

        const { ids, motivo,genero } = request.body;

        var idsCargos = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsCargos += (element + "");
                first = false;
            } else {
                idsCargos += (',' + element);
            }
        });

        console.log("Ids cargos eliminar  " + idsCargos);
        //eliminar_cargos_alumno(IN ids_cargos_param text,motivo text,ID_GENERO integer) 
        pool.query("select eliminar_cargos_alumno('" + idsCargos +"','"+ motivo+"'," + genero + ") as ids_cagos_eliminados;",
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {
                    //Enviar mensaje de recepcion
                    console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                    var listaIdsCargos = results.rows.map(e => e.ids_cagos_eliminados);
                    console.log(" listaIdsCargos "+listaIdsCargos);
                    //enviarMensajeEntradaSalida(listaIdsAsistencias, ENTRADA);
                }

                response.status(200).json(results.rowCount);
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
    getBalanceAlumno,
    getPagosByCargoId,
    eliminarCargos   

}