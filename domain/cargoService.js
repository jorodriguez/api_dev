

const handle = require('../helpers/handlersErrors');
const { CARGOS } = require('../utils/Constantes');
const cargosDao = require('../dao/cargoDao');
const alumnoDao = require('../dao/alumnoDao');
const notificacionService = require('../utils/NotificacionService');

//registrar pagos
const registrarCargo = (cargoData) => {
    console.log("@registrarCargo");

    return new Promise((resolve, reject) => {
        cargosDao
            .registrarCargo(cargoData)
            .then(respuesta => {
                console.log("Enviar correo de cargo");
                notificacionService.notificarCargo(cargoData.id_alumno, respuesta.id_cargo);
                //Aqui enviar el mensaje al movil
                resolve(respuesta);
            }).catch(error => {
                console.log("ERROR al guardar el cargo "+error);
                reject(error);
            });
    });
    /*
               getResultQuery(
                sql,
                parametros,
                response,
                (results) => {
                    console.log("Se llamo a la function de cargo ");
                    //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                    //buscar el padre y enviarle la notificacion y el correo del registro del pago
                    if (results.rowCount > 0) {
                        var id_cargo_generado = results.rows[0].id_cargo_generado;
                        console.log("IDE CARGO GENERADO RESULT "+JSON.stringify(results.rows));
                        respuesta.id_cargo = id_cargo_generado;
                        respuesta.resultado = (id_cargo_generado != null);
                        respuesta.mensaje = `${results.rowCount} fila afectada`;
                        notificacionService.notificarCargo(id_alumno,id_cargo_generado);
    
                        response.status(200).json(respuesta);
                    } else {
                        respuesta.mensaje = "No se guardó el cargo.";
                        response.status(200).json(respuesta);
                    }
                });*/
};

const completarRegistroRecargoMensualidad = (idAlumno,idCargoMensualidad,idRecargo,genero)=>{    
    return new Promise((resolve,reject)=>{
            cargosDao
                .completarRegistroRecargoMensualidad(
                        idCargoMensualidad,
                        idRecargo,genero
                ).then(id=>{
                    console.log("Registro de recargo relacionado a la mensualidad ");
                    //actualizar fecha pago proximo mes
                    alumnoDao
                        .actualizarProximaFechaLimitePagoMensualidadAlumno(
                                idAlumno,
                                genero
                        ).then(id=>{
                                console.log("Registro de fecha limite de pago actualizado al proximo mes");
                            resolve(id);
                        }).catch(error=>reject(error));
            }).catch(error=>reject(error));
    });
    
}


const getCatalogoCargos = () => {
    console.log("@getCatalogoCargos");
    return cargosDao.getCatalogoCargos();
};


const getCargosAlumno = (idAlumno) => {
    console.log("@getCargosAlumno");

    return cargosDao.getCargosAlumno(idAlumno);
};

const getBalanceAlumno = (idAlumno) => {
    console.log("@getBalanceAlumno");

    return cargosDao.getBalanceAlumno(idAlumno);

};

const eliminarCargos = (idCargos) => {
    console.log("@eliminarCargos");
    return cargosDao.eliminarCargos(idCargos);
};

const obtenerMesesAdeudaMensualidad = (idAlumno) => {
    console.log("@obtenerMesesAdeudaMensualidad");

    return cargosDao.obtenerMesesAdeudaMensualidad(idAlumno);

}


module.exports = {   
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,    
    eliminarCargos,
    obtenerMesesAdeudaMensualidad,
    completarRegistroRecargoMensualidad
}