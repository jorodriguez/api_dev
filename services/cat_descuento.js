
const catDescuentoService = require('../domain/catDescuentoService');
const handle = require('../helpers/handlersErrors');

const getDescuentos = (request, response) => {
    console.log("@getDescuentos");

    try {

        const id_empresa = request.params.id_empresa;

        console.log("Empresa "+id_empresa);

        catDescuentoService.getDescuentos(id_empresa)
            .then(results => {
                console.log(" ===>  "+JSON.stringify(results));
                response.status(200).json(results);
            }).catch(error => {
                console.log(" error al cardar los descuentos ");
                handle.callbackError(error, response);
            });

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};



module.exports = {
    getDescuentos
};