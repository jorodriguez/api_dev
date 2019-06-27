
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria  = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


const getReportePrincipal = (request, response) => {
    console.log("@getReportePrincipal");
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
            "       a.icono,"+
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

/*

select a.id,
		a.nombre,
		a.apellidos,
		a.hora_entrada,
		a.hora_salida,
		a.costo_colegiatura,
		a.costo_inscripcion,
		a.minutos_gracia,
		a.fecha_inscripcion,
		a.fecha_reinscripcion,
		suc.nombre as nombre_sucursal, 
		balance.id as id_balance,
		balance.total_adeudo,
		balance.total_pagos,
		balance.total_cargos
from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
				 inner join co_grupo grupo on a.co_grupo = grupo.id
				inner join co_sucursal suc on a.co_sucursal =suc.id
where co_bal

select to_json(c.nombre,count(cargo.*)) 
from co_cargo_balance_alumno cargo inner join cat_cargo c on cargo.cat_cargo = c.id
where cargo.pagado = false and cargo.co_balance_alumno = 16 and cargo.eliminado = false
group by c.nombre

*/ 

module.exports = {
    getCatalogoActividades,
    registrarActividad  
}