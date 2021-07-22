
const handle = require('../helpers/handlersErrors');
const reporteAsistenciaUsuarioService = require('../domain/reporteAsistenciaUsuarioService');

const getReporteAsistenciaUsuario = async (request, response) => {
    console.log("@getReporteAsistenciaUsuario");
    try {

        const { id_sucursal,fecha_inicio,fecha_fin } = request.params;

        console.log(id_sucursal+" "+fecha_inicio+" "+fecha_fin);

        const asistencia = await reporteAsistenciaUsuarioService.getAsistenciaUsuarios(id_sucursal,fecha_inicio,fecha_fin);

        response.status(200).json(asistencia);

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const getUsuariosAsistencias = async (request, response) => {
    console.log("@getUsuarioAsistencias");
    try {

        const { id_sucursal } = request.params;
       
        const usuarios = await reporteAsistenciaUsuarioService.getUsuariosAsistencia(id_sucursal);

        response.status(200).json(usuarios);

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};





module.exports = {
  getReporteAsistenciaUsuario,getUsuariosAsistencias
};
