

const cargosDao = require('../dao/cargoDao');
const alumnoDao = require('../dao/alumnoDao');
const notificacionService = require('../utils/NotificacionService');
const { getHtmlPreviewTemplate,TEMPLATES } = require('../utils/CorreoService');

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
    
};


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
};

const obtenerFiltroAniosCargosSucursal = (idSucursal) => {
    console.log("@obtenerFiltroAniosCargosSucursal");

    return cargosDao.obtenerFiltroAniosCargosSucursal(idSucursal);
};

const obtenerEstadoCuentaAlumno = async (idAlumno) => {
    console.log("@obtenerEstadoCuentaAlumno");    
     const informacionAlumno = await alumnoDao.getCorreosTokensAlumno(idAlumno);  
     let estado = await cargosDao.obtenerEstadoCuenta(idAlumno);         
     return {...estado,
            padres:{
                    nombre_padres: informacionAlumno ? informacionAlumno.nombres_padres : '',
                    correos:  informacionAlumno ? informacionAlumno.correos : ''
                }
            };
};

const obtenerPreviewEstadoCuenta = async (idAlumno)=>{
    const params = await obtenerEstadoCuentaAlumno(idAlumno);
    return await getHtmlPreviewTemplate(TEMPLATES.TEMPLATE_ESTADO_CUENTA,params);
};



module.exports = {   
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,    
    eliminarCargos,
    obtenerMesesAdeudaMensualidad,
    completarRegistroRecargoMensualidad,
    obtenerFiltroAniosCargosSucursal,
    obtenerEstadoCuentaAlumno,
    obtenerPreviewEstadoCuenta
};