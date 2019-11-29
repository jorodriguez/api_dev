
const { QUERY,getCatalogo } = require('./sqlHelper');

const getFormasPago = (request, response) => {
    console.log("@getFormasPago");    
    getCatalogo(QUERY.FORMA_PAGO,response);              
};

const getCatGenero = (request, response) => {
    console.log("@getCatGenero");       
    getCatalogo(QUERY.CAT_GENERO,response);
};


const getGrupos = (request, response) => {
    console.log("@getGrupos");
    getCatalogo(QUERY.GRUPO,response);
};

const getServicios = (request, response) => {
    console.log("@getServicios");
    getCatalogo(QUERY.SERVICIOS,response);
};

module.exports = {
    getCatalogo,
    getFormasPago,
    getCatGenero,    
    getGrupos,
    getServicios
}