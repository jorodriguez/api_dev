
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getActividadesPorAlumno = (request, response) => {
    console.log("@getActividadesPorAlumno");
    try {
        /*var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }*/
        //agregar el parametro del padre

        const id_alumno = request.params.id_alumno;

        pool.query(
            `
            select  r.fecha,
		r.hora,
		ac.nombre as actividad,
        tipo.nombre as tipo_actividad,
		sub.nombre as sub_actividad,
		r.nota,
		a.nombre as nombre_alumno,
		a.apellidos as apellidos_alumno,
		r.url_foto,
		r.*
from co_registro_actividad r inner join cat_actividad ac on r.cat_actividad = ac.id 
							left join cat_tipo_actividad tipo on r.cat_tipo_actividad = tipo.id
							 left join cat_sub_actividad sub on r.cat_sub_actividad = sub.id
							 inner join co_alumno a on r.co_alumno = a.id
where co_alumno = $1 and fecha = getDate('')
order by r.fecha,r.hora desc
            `,[id_alumno],
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
    getActividadesPorAlumno
}