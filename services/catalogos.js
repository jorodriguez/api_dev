
const { QUERY,getCatalogo } = require('./catagolosHelper');

const getFormasPago = (request, response) => {
    console.log("@getFormasPago");    
    getCatalogo(QUERY.FORMA_PAGO,request,response);              
};

const getCatGenero = (request, response) => {
    console.log("@getCatGenero");       
    getCatalogo(QUERY.CAT_GENERO,request,response);
};


const getGrupos = (request, response) => {
    console.log("@getGrupos");
    getCatalogo(QUERY.GRUPO,request,response);
};

const getServicios = (request, response) => {
    console.log("@getServicios");
    getCatalogo(QUERY.SERVICIOS,request,response);
};


module.exports = {
    getCatalogo,
    getFormasPago,
    getCatGenero,    
    getGrupos,
    getServicios
}