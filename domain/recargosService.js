const recargoDao = require('../dao/recargosDao');
const { CRITERIO } = require('../dao/recargosDao');
const cargoService = require('./cargoService');
const CONSTANTES = require('../utils/Constantes');
const { existeValorArray, isEmptyOrNull } = require('../utils/Utils');
const notificacionRecargosService = require('../utils/NotificacionRecargosService');
const notificacionService = require('../utils/NotificacionService');

async function ejecutarProcesoRecargoMensualidad() {

    const listaSucursales = await recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.AGREGAR_RECARGO);
    if (existeValorArray(listaSucursales)){
        for (let index in listaSucursales) {

            let sucursal = listaSucursales[index];

            if (!isEmptyOrNull(sucursal)) {
                console.log("sucursal " + JSON.stringify(sucursal));
                console.log("REGISTRANDO RECARGO PARA LA SUCURSAL " + sucursal.nombre_sucursal);

                let cargosAplicarRecargo = sucursal.mensualidades_vencidas;

                if (existeValorArray(cargosAplicarRecargo)) {
                    for (let i in cargosAplicarRecargo) {

                        let cargoMensualidad = cargosAplicarRecargo[i];
                        //let cargoMensualidad = item;

                        if (!isEmptyOrNull(cargoMensualidad)) {
                            console.log("mensualidad para aplicar recargo alumno " + cargoMensualidad.nombre_alumno);
                            //fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero
                            let objetoCargo = {
                                fecha_cargo: new Date(),
                                id_alumno: cargoMensualidad.id_alumno,
                                cat_cargo: { id: CONSTANTES.CARGOS.ID_RECARGO_MENSUALIDAD },
                                cantidad: 1,
                                monto: 0,
                                nota: `RECARGO AUTOMÁTICO (Mensualidad de ${cargoMensualidad.texto_ayuda}).`.toUpperCase(),
                                genero: CONSTANTES.USUARIO_DEFAULT
                            };
                            console.log("REGISTRAR EL RECARGO ");
                            
                            const cargoRegistrado = await cargoService.registrarCargo(objetoCargo);                          
                            console.log("Cargo registrados "+JSON.stringify(cargoRegistrado));
                            const id =  await cargoService
                                                .completarRegistroRecargoMensualidad(
                                                        cargoMensualidad.id_alumno,
                                                        cargoMensualidad.id_cargo_balance_alumno, 
                                                        cargoRegistrado.id_cargo, 
                                                        CONSTANTES.USUARIO_DEFAULT
                                                        );                          
                            await notificacionService.notificarCargo(cargoMensualidad.id_alumno, cargoRegistrado.id_cargo);              
                            console.log("Termina proceso de registro idcargo registrado "+id);
                        } else {
                            console.log("No existen mensualidades vencidas ");
                        }
                    }
                }
            } else {
                console.log("No existen mensualidades para recargos de la suc "+sucursal.nombre_sucursal);
            }
        }
    }else{
        console.log(" XX no existen mensualidades para recargos XX ");
    }

/*
    recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.AGREGAR_RECARGO)
        .then(results => {
            //console.log("RESULTS "+JSON.stringify(results));
            if (existeValorArray(results)) {
                let listaSucursales = results;
                for (let index in listaSucursales) {

                    let sucursal = listaSucursales[index];

                    if (!isEmptyOrNull(sucursal)) {
                        console.log("sucursal " + JSON.stringify(sucursal));
                        console.log("REGISTRANDO RECARGO PARA LA SUCURSAL " + sucursal.nombre_sucursal);

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
                                        nota: `RECARGO AUTOMÁTICO (${cargoMensualidad.texto_ayuda}).`,
                                        genero: CONSTANTES.USUARIO_DEFAULT
                                    };
                                    console.log("REGISTRAR EL RECARGO ");
                                    cargoService
                                        .registrarCargo(objetoCargo)
                                        .then(results => {
                                            cargoService
                                                .completarRegistroRecargoMensualidad(cargoMensualidad.id_cargo_balance_alumno, results.id_cargo, CONSTANTES.USUARIO_DEFAULT)
                                                .then(id => {

                                                    //Agregar a un array los recargos generados actualmente y enviarlos a los roles dueños y sucursales
                                                    console.log("====> relacion ok enviar correo a relacion" + id);                                                                                                     


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
        */
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
                        console.log("Enviar recordatorio para la sucursal " + sucursal.nombre_sucursal + " VENCIDAS " + sucursal.mensualidades_vencidas);

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
                            notificacionRecargosService.enviarReporteProxRecargos(sucursal, listaMensualidades);
                        }
                    }
                }
            }
        }).catch(error => {
            console.error("[recargosService] Error al ejecutar el proceso de envio de recargos para mañana " + JSON.stringify(error));
        });
}




function obtenerPagosVencenSemanaActual(idSucursal) {
    console.log("@obtenerPagosVencenSemanaActual sucursal "+idSucursal);
    try {
        return recargoDao.getMensualidadesParaRecargoPorSucursal(CRITERIO.VENCIDOS,idSucursal);
      //return recargoDao.getMensualidadesParaRecargoPorSucursal(CRITERIO.VENCEN_SEMANA_ACTUAL,idSucursal);

    } catch (e) {
        console.log( e);
    }

}

const obtegerMensualidadesRecargo = async ()=>{
    console.log("@obtegerMensualidadesRecargo");
    return await recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.AGREGAR_RECARGO);
};


module.exports = { ejecutarProcesoRecargoMensualidad, enviarRecordatorioPagoPadresAlumno ,obtenerPagosVencenSemanaActual,obtegerMensualidadesRecargo};