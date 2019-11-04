
//import {validarToken} from '../helpers/helperTokenMovil';
//import { ROWS_POR_PAGINACION }  from '../utils/Constantes';

const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { ROWS_POR_PAGINACION,TIPO_CARGO } = require('../utils/Constantes');


const getProductos = (request, response) => {
    console.log("@getProductos");

    var respuesta = validarToken(request,response);

    if (!respuesta.tokenValido) {
        return response.status(respuesta.statusNumber).send(respuesta);
    }     

    let page = request.params.pagina || 0;    

    try {
        pool.query(
            `
            SELECT prod.id,
	            prod.nombre,
	            prod.descripcion,
	            prod.precio,
                prod.notificar,
                prod.es_facturable,
                tipo.id as id_tipo_cargo,
	            tipo.nombre as nombre_tipo,
	            categoria.id as id_categoria,
	            categoria.nombre as nombre_categoria,
	            prod.existencia,
                prod.caracteristicas,
                coalesce(prod.fotos,'[]') as fotos,
	            count(*) OVER() AS full_count
        FROM CAT_CARGO prod inner join cat_tipo_cargo tipo on prod.cat_tipo_cargo = tipo.id
					inner join cat_categoria categoria on prod.cat_categoria = categoria.id						
        WHERE tipo.id = ${TIPO_CARGO.PRODUCTO} AND prod.ELIMINADO = false 
        ORDER BY prod.nombre
        LIMIT  ${ROWS_POR_PAGINACION}
        OFFSET ${page * ROWS_POR_PAGINACION}`,            
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }                
                respuesta.respuesta = results.rows;
                response.status(respuesta.statusNumber).json(respuesta);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }

};

module.exports = {
    getProductos
}