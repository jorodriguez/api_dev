const { QUERY, getCatalogo } = require('./sqlHelper');
const handle = require('../helpers/handlersErrors');
const grupoService = require('../domain/grupoService');

const getFormasPago = (request, response) => {
    console.log("@getFormasPago");
    getCatalogo(QUERY.FORMA_PAGO, response);
};

const getCatGeneroFamiliar = (request, response) => {
    console.log("@getCatGeneroFamiliar");
    getCatalogo(QUERY.CAT_GENERO_FAMILIAR, response);
};

const getCatGeneroAlumno = (request, response) => {
    console.log("@getCatGeneroAlumno");
    getCatalogo(QUERY.CAT_GENERO_ALUMNO, response);
};


const getGrupos = async(request, response) => {
    console.log("@getGrupos");
    try {
        const params = { id_sucursal } = request.params;

        let res = await grupoService.getAllGruposSucursal(id_sucursal);

        response.status(200).json(res);
    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
}



const getServicios = (request, response) => {
    console.log("@getServicios");
    getCatalogo(QUERY.SERVICIOS, response);
};


module.exports = {
    getCatalogo,
    getFormasPago,
    getCatGeneroFamiliar,
    getCatGeneroAlumno,
    getGrupos,
    getServicios
}