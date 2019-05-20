
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


const registrarActividad = (request, response) => {
    console.log("@registrarActividad");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { alumnosIds,cat_actividad,tipo_actividad,sub_actividad,nota,genero } = request.body;

        console.log("=====>> "+JSON.stringify(request.body));

        /*console.log("ids "+alumnosIds);
        console.log("cat_tipo_actividad "+cat_actividad);
        console.log("tipo_actividad "+tipo_actividad);
        console.log("sub_actividad "+sub_actividad);
        console.log("nota "+nota);
        console.log("genero "+genero);*/
        
        var nullOrEmpty = (val)=>{ 
            if(val === null || val === -1 || val==='' || val===undefined) 
            return null
            else return val;
        };
        var nullOrEmptyStr = (val)=>{ 
            if(val === null || val === -1 || val==='' || val===undefined) 
            return ''
            else return val;
        };

        var sqlComplete = " VALUES ";
        for (var i = 0; i < alumnosIds.length; i++) {
            if (i > 0) {
                sqlComplete += ",";
            }                      
            sqlComplete += "(" + alumnosIds[i] + ","+
                            cat_actividad+","+
                            nullOrEmpty(tipo_actividad)+","+
                            nullOrEmpty(sub_actividad)+","+
                            "current_date,"+
                            "getHora(''),"+
                            "'"+nullOrEmptyStr(nota)+"',"+
                            "'',"+
                            genero
                            +")";
        };

        console.log(" SQL "+sqlComplete);

        pool.query("INSERT INTO co_registro_actividad(co_alumno,cat_actividad,cat_tipo_actividad,cat_sub_actividad,fecha,hora,nota,url_foto,genero) " +            
            sqlComplete,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }                
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
        
    }
};


module.exports = {
    getCatalogoActividades,
    registrarActividad  
}