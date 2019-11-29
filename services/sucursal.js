
const { QUERY,getCatalogo } = require('./sqlHelper');

const getSucursales = (request, response) => {
    console.log("@getSucursales");
    getCatalogo(QUERY.SUCURSALES,response);
};

module.exports = {
    getSucursales
}