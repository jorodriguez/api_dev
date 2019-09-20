
const { QUERY,getCatalogo } = require('./catagolosHelper');

const getSucursales = (request, response) => {
    console.log("@getSucursales");

    getCatalogo(QUERY.SUCURSALES,request,response);
};

module.exports = {
    getSucursales
}