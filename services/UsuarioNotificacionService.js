
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const {validarToken} = require('../helpers/helperTokenMovil');
const { ESTATUS } = require('../utils/Constantes');
const { getQueryInstance } = require('./sqlHelper');



function obtenerCorreosCopiaPorTema(co_sucursal, id_tema) {
    return getQueryInstance(`
        SELECT array_to_json(array_agg(to_json(correo))) as correos_copia
        FROM co_correo_copia_notificacion
        WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false
   `, [co_sucursal, id_tema]);
}


module.exports = {
    obtenerCorreosCopiaPorTema
}