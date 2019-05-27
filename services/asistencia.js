
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

//FIXME : agregar el parametro de fecha
const getAlumnosRecibidos = (request, response) => {
    console.log("@getAlumnosRecibidos");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query("SELECT asistencia.id," +
            " asistencia.fecha," +
            " asistencia.hora_entrada," +
            " asistencia.hora_salida," +
            " alumno.id as id_alumno," +
            " alumno.nombre as nombre_alumno,	 " +
            " alumno.apellidos as apellido_alumno, " +
            " grupo.nombre as nombre_grupo"+
            " FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id " +
            "                               inner join co_grupo grupo on alumno.co_grupo = grupo.id "+
            " WHERE asistencia.fecha = current_date AND asistencia.hora_salida is null AND alumno.eliminado=false " +
            "           AND alumno.co_sucursal = $1" +
            " ORDER BY alumno.hora_salida DESC",
            [id_sucursal],
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

const getAlumnosPorRecibir = (request, response) => {
    console.log("@getAlumnosPorRecibir");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query("SELECT a.*" +
            " FROM co_alumno a " +
            "  WHERE id not in (" +
            "               SELECT asistencia.co_alumno" +
            "                   FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno=alumno.id" +
            "                   WHERE asistencia.fecha = current_date AND asistencia.hora_salida is null   " +
            "  AND alumno.co_sucursal = $1" +
            "  AND asistencia.eliminado=false" +
            ") " +
            " AND a.co_sucursal = $2 " +
            " AND a.eliminado = false "+
            " ORDER BY a.hora_entrada ASC",
            [id_sucursal,id_sucursal],
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


const registrarEntradaAlumnos = (request, response) => {
    console.log("@registrarEntrada");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { ids,genero } = request.body;
              
        var sqlComplete = " values ";
        for (var i = 0; i < ids.length; i++) {

            if (i > 0) {
                sqlComplete += ",";
            }
            
            sqlComplete += "(current_date," + ids[i] + ",getHora('')," + genero + "," + genero + ")";
        };

        pool.query("INSERT INTO CO_ASISTENCIA(fecha,co_alumno,hora_entrada,usuario,genero) " +
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

const registrarSalidaAlumnos = (request, response) => {
    console.log("@registrarSalidaAlumnos");

    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { ids, genero  } = request.body;
       
        var sqlComplete = " ( ";
        for (var i = 0; i < ids.length; i++) {

            if (i > 0) {
                sqlComplete += ",";
            }
            sqlComplete += "" + ids[i];
        };
        sqlComplete += ")";

        pool.query("UPDATE CO_ASISTENCIA "+
                    " SET hora_salida = getHora('') ,"+
                    "  modifico = $1 " +
                    " WHERE id IN " + sqlComplete,
                    [genero],
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
    getAlumnosRecibidos,
    getAlumnosPorRecibir,
    registrarEntradaAlumnos,
    registrarSalidaAlumnos
}