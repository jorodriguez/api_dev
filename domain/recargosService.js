const recargoDao = require('../dao/recargosDao');
const { CRITERIO } = require('../dao/recargosDao');
const cargoService = require('./cargoService');
const CONSTANTES = require('../utils/Constantes');
const { existeValorArray, isEmptyOrNull } = require('../utils/Utils');
const notificacionRecargosService = require('../utils/NotificacionRecargosService');

function ejecutarProcesoRecargoMensualidad() {

    recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.VENCIDOS)
        .then(results => {
            //console.log("RESULTS "+JSON.stringify(results));
            if (existeValorArray(results)) {
                let listaSucursales = results;
                for (let index in listaSucursales) {

                    let sucursal = listaSucursales[index];

                    if (!isEmptyOrNull(sucursal)) {
                        console.log("sucursal " + JSON.stringify(sucursal));
                        console.log("REGISTRANDO RECARGO PARA " + sucursal.nombre_sucursal);

                        let cargosAplicarRecargo = sucursal.mensualidades_vencidas;

                        if (existeValorArray(cargosAplicarRecargo)) {
                            for (let i in cargosAplicarRecargo) {

                                let cargoMensualidad = cargosAplicarRecargo[i];

                                if (!isEmptyOrNull(cargoMensualidad)) {
                                    console.log("mensualida para aplicar recargo alumno " + cargoMensualidad.nombre_alumno);
                                    //fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero
                                    let objetoCargo = {
                                        fecha_cargo: new Date(),
                                        id_alumno: cargoMensualidad.id_alumno,
                                        cat_cargo: { id: CONSTANTES.CARGOS.ID_RECARGO_MENSUALIDAD },
                                        cantidad: 1,
                                        monto: 0,
                                        nota: CONSTANTES.MENSAJE_RECARGO_POR_MENSUALIDAD_VENCIDA,
                                        genero: CONSTANTES.USUARIO_DEFAULT
                                    }
                                    console.log("REGISTRAR EL RECARGO ");
                                    cargoService
                                        .registrarCargo(objetoCargo)
                                        .then(results => {
                                            cargoService
                                                .relacionarRecargoConMensualidad(cargoMensualidad.id_cargo_balance_alumno, results.id_cargo, CONSTANTES.USUARIO_DEFAULT)
                                                .then(id => {

                                                    //Agregar a un array los recargos generados actualmente y enviarlos a los roles dueños y sucursales

                                                    console.log("====> relacion ok enviar correo a relacion" + id);
                                                    //noti

                                                }).catch(error => console.log("Existio un error al relacionar el recargo " + JSON.stringify(error)));
                                        }).catch(error => {
                                            console.error("Error al registrar un recargo " + error);
                                        });
                                } else {
                                    console.log("No existen mensualidades vencidas ");
                                }
                            }
                        }
                    } else {
                        console.log("No existen mensualidades para recargos de la suc ");
                    }
                }
            } else {
                console.log(">>>>> No existen mensualidades para realizar recargos <<<<<<");
            }
        }).catch(error => {
            console.error("[recargosService] Error al ejecutar el proceso de recargos " + JSON.stringify(error));
        });

}


//enviar notificacion a mises por sucursar de los recargos que se van a realizar mañana
//enviar la lista completa a los dueños
//Enviarlo a las 10:00am que vence mañana 
function enviarRecordatorioPagoPadresAlumno() {
    recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.VENCEN_MANANA)
        .then(results => {
            if (existeValorArray(results)) {
                let listaSucursales = results;
                for (let index in listaSucursales) {

                    let sucursal = listaSucursales[index];

                    if (!isEmptyOrNull(sucursal)) {
                        console.log("sucursal " + JSON.stringify(sucursal));
                        console.log("Enviar recordatorio para la sucursal " + sucursal.nombre_sucursal);                       
                        
                        let listaMensualidades = sucursal.mensualidades_vencidas;

                        if (sucursal.existen_mensualidades_vencidas) {
                            for (let ind in listaMensualidades) {
                                let cargoMes = listaMensualidades[ind];
                                if (!isEmptyOrNull(cargoMes)) {
                                    notificacionRecargosService
                                        .enviarRecordatorioPagoMesualidad(
                                            cargoMes.id_alumno,
                                            [cargoMes],
                                            cargoMes.fecha_limite_pago_mensualidad_formateada
                                        );
                                }
                            }
                            //Enviar el correo para las maestras de cada suc
                            notificacionRecargosService.enviarReporteProxRecargos(sucursal,listaMensualidades);
                        }                    
                    }
                }
            }
        }).catch(error => {
            console.error("[recargosService] Error al ejecutar el proceso de envio de recargos para mañana " + JSON.stringify(error));
        });
}



// proceso de recargos en el día enviar correo a cada papa y toda la lista a las mises
//enviar la lista completa a los dueños de todas las sedes

module.exports = { ejecutarProcesoRecargoMensualidad, enviarRecordatorioPagoPadresAlumno }