const reporteAsistenciaUsuarioDao = require('../dao/reporteAsistenciaUsuarioDao');

const getAsistenciaUsuarios = (coSucursal,fechaInicio,fechaFin) => {
    console.log("@getAsistenciaUsuarios");
    return reporteAsistenciaUsuarioDao
            .obtenerAsistenciaUsuario(coSucursal,fechaInicio,fechaFin);

};

const getUsuariosAsistencia = (coSucursal) => {
    console.log("@getUsuariosAsistencia");
    return reporteAsistenciaUsuarioDao.obtenerUsuariosAsistencias(coSucursal);
};


module.exports = { getAsistenciaUsuarios,getUsuariosAsistencia};