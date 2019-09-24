
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');

const QUERY = {
    FORMA_PAGO : "SELECT * FROM CO_FORMA_PAGO WHERE ELIMINADO = FALSE",
    CAT_GENERO : "SELECT * FROM CAT_GENERO WHERE ELIMINADO = FALSE",
    GRUPO : "SELECT * FROM CO_GRUPO WHERE ELIMINADO = false",
    SERVICIOS : "SELECT * FROM cat_servicio WHERE ELIMINADO = false order by nombre",
    CARGOS : "SELECT * FROM CAT_CARGO WHERE ELIMINADO = false order by nombre",
    SUCURSALES : "SELECT id,nombre,direccion,class_color from FROM CO_SUCURSAL WHERE ELIMINADO = false ",
};


const getCatalogo = (query,request,response) => {
    console.log("@getCatalogo");
    try {
       // validarToken(request,response);        
        
        if(query == undefined || query == ''){
            console.log("No esta definido el query");
            return;
        }
        
        pool.query(query,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);    
            });
       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

module.exports = {
    QUERY,
    getCatalogo 
}