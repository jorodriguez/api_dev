
const pagoService = require('../domain/pagoService');
const handle = require('../helpers/handlersErrors');
const notificacionService = require('../utils/NotificacionService');

const registrarPago = (request, response) => {
    console.log("@registrarPago");
    try {
        //const pagoData = { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = request.body;
        //const pagoData = { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = request.body;
        const pagoData =
            {
                id_alumno,
                pago,
                nota,
                ids_cargos,
                cargos_desglosados,
                ids_cargos_descuento,
                id_descuentos_desglose,
                cat_forma_pago,
                identificador_factura,
                identificador_pago,
                genero
            } = request.body;

        pagoService
            .registrarPago(pagoData)
            .then(results => {
                notificacionService.notificarReciboPago(id_alumno, results.agregar_pago_alumno,false);
                //notificacionService.notificarReciboPago(id_alumno, retorno.agregar_pago_alumno);
                response.status(200).json(results);
            }).catch(error => {
                console.log("No se guardo el pago " + error);
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const reenviarComprobantePago = (request, response) => {
    console.log("@reenviar comprobante de Pago");
    try {
        const pagoData =
            {
                id_alumno,
                id_pago
            } = request.body;

        notificacionService
            .notificarReciboPago(id_alumno, id_pago,true)
            .then(result => {
                response.status(200).json(result);
            }).catch(error => {
                console.log("No se guardo el pago " + error);
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

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
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};
module.exports = {
    registrarPago,
    getPagosByCargoId,
    reenviarComprobantePago
};