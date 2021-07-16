const reporteAsistenciaUsuarioDao = require('../dao/reporteAsistenciaUsuarioDao');

const getAsistenciaUsuarios = (coSucursal,fechaInicio,fechaFin) => {
    console.log("@getAsistenciaUsuarios");
    return reporteAsistenciaUsuarioDao
            .obtenerAsistenciaUsuario(coSucursal,fechaInicio,fechaFin);

};

module.exports = { getAsistenciaUsuarios};