const recargoDao = require('../dao/recargosDao');
const {CRITERIO} = require('../dao/recargosDao');
const cargoService = require('./cargoService');
const CONSTANTES = require('../utils/Constantes');

function ejecutarProcesoRecargoMensualidad(){
    recargoDao.getMensualidadesParaRecargoTodasSucursales(CRITERIO.VENCIDOS)
    .then(results => {
        if (existeValorArray(results)) {
            let listaSucursales = results;
            for (let sucursal in listaSucursales) {
                console.log("REGISTRANDO RECARGO PARA " + sucursal.nombre);
                
                let cargosAplicarRecargo = sucursal.mensualidades_vencidas;

                if(existeValorArray(cargosAplicarRecargo)){
                    for(let cargoMensualidad in cargosAplicarRecargo){
                        console.log("mensualida para aplicar recargo alumno "+cargoMensualidad.nombre_alumno);
                        //fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero
                        let objetoCargo = {
                            fecha_cargo: new Date(),
                            id_alumno : cargoMensualidad.id_alumno,
                            cat_cargo : CONSTANTES.CARGOS.ID_RECARGO_MENSUALIDAD,
                            cantidad:1,
                            monto:0,
                            nota:CONSTANTES.MENSAJE_RECARGO_POR_MENSUALIDAD_VENCIDA,
                            genero:CONSTANTES.USUARIO_DEFAULT
                        }
                        console.log("REGISTRAR EL RECARGO ");
                        cargoService
                            .registrarCargo(objetoCargo)
                            .then(results=>{
                                    cargoService
                                    .relacionarReacargoConMensualidad(cargoMensualidad.id_cargo_balance_alumno,results.id_cargo_generado, CONSTANTES.USUARIO_DEFAULT)
                                    .then(id=>{
                                        console.log("relacion ok");
                                    }).catch(error=>console.log("Existio un error"));
                            });
                    }                    
                }
            }
        }
    }).catch(error => {

    });

}


//enviar notificacion a mises por sucursar de los recargos que se van a realizar mañana
//enviar la lista completa a los dueños



// proceso de recargos en el día enviar correo a cada papa y toda la lista a las mises
//enviar la lista completa a los dueños de todas las sedes
