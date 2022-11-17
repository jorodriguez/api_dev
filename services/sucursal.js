const { QUERY, getCatalogo } = require('./sqlHelper');
const handle = require('../helpers/handlersErrors');
const sucursalService = require('./../domain/sucursalService');

const getSucursales = (request, response) => {
    console.log("@getSucursalId");
    try {
        const params = { listaSalida = [], listaCalcularHorasExtras = [], genero } = request.body;
        asistenciaService
            .registrarSalidaAlumnos(params)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                handle.callbackError(error, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }

};


const getInfoSucursal = async(request, response) => {
    console.log("@getInfoSucursal");
    try {
        const params = { id } = request.params;

        let res = await sucursalService.getInfoSucursal(id);

        response.status(200).json(res);
    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
}

module.exports = {
    getSucursales,
    getInfoSucursal
};