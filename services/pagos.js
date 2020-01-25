
const pagoService = require('../domain/pagoService');
const handle = require('../helpers/handlersErrors');

const registrarPago = (request, response) => {
    console.log("@registrarPago");
    try {
        const pagoData = { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = request.body;

        pagoService
            .registrarPago(pagoData)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                console.log("No se guardo el pago " + error);
                handle.callbackError(error, response);
            });

        /*
                console.log("=====>> " + JSON.stringify(request.body));
                const { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = request.body;
        
                console.log("SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'" + identificador_factura + "'," + genero + " )");
        
                getResultQuery(
                    "SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'" + identificador_factura + "'," + genero + " );",
                    [],
                    response,
                    (results) => {
                        if (results.rowCount > 0) {
                            let retorno = results.rows[0];
                            console.log("Retorno el ID " + JSON.stringify(results.rows));
                            notificacionService.notificarReciboPago(id_alumno, retorno.agregar_pago_alumno);
                            //enviar datos de facturacion al canal de notificaciones 
                            //enviarDatosParaFactura(id_alumno,retorno.agregar_pago_alumno);
                        }
                        response.status(200).json(results.rowCount);
                    });*/
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}
const getPagosByCargoId = (request, response) => {
    console.log("@getPagosByCargoId");
    try {

        const id_cargo_balance_alumno = request.params.id_cargo_balance_alumno;

        pagoService
            .getPagosByCargoId(id_cargo_balance_alumno)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                handle.callbackError(error, response);
            });
        /*
                console.log("request.params.id_cargo_balance_alumno " + request.params.id_cargo_balance_alumno);
        
                var id_cargo_balance_alumno = request.params.id_cargo_balance_alumno;
        
                getResultQuery(
                    ` 	
                      SELECT forma_pago.id as id_forma_pago,
                            forma_pago.nombre as nombre_forma_pago,
                            pago.identificador_factura ,r.*
                       FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                           inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
                       WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
                       ORDER BY pago.fecha DESC`,
                    [id_cargo_balance_alumno],
                    response);*/
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};
module.exports = {
    registrarPago,
    getPagosByCargoId
}