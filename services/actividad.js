
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

//obtener actividades
const getCatalogoActividades = (request, response) => {
    console.log("@getCatalogoActividades");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
        pool.query(
            "WITH actividades AS( "+
            "   SELECT a.id,"+
            "       a.nombre,"+
            "       a.posicion,"+
            "    ("+
            "        select array_to_json("+
            "            (select array_agg(ta.*) from cat_tipo_actividad ta where ta.cat_actividad =  a.id )"+
            "         )"+
            "    ) as tipo_actividad,"+
            "    ("+
            "        select array_to_json("+
            "            (select array_agg(ta.*) from cat_sub_actividad ta where ta.cat_actividad =  a.id )"+
            "         )"+
            "    ) as sub_actividad		"+
            " FROM cat_actividad a"+
            " WHERE a.eliminado = false "+
            " ORDER BY a.posicion ASC"+
            " ) select array_to_json(array_agg(a.*))  as catalogo_actividades "+
            "   FROM actividades a",            
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
    getCatalogoActividades    
}