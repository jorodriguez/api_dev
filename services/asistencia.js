
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

        pool.query(
            "SELECT asistencia.id," +
            " asistencia.fecha," +
            " asistencia.hora_entrada," +
            " asistencia.hora_salida," +
            " alumno.id as id_alumno," +
            " alumno.nombre as nombre_alumno," +
            " alumno.apellidos as apellido_alumno," +
            " grupo.id as co_grupo," +
            " grupo.nombre as nombre_grupo," +
            " true as visible," +
            " false as seleccionado" +
            " FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id " +
            "                               inner join co_grupo grupo on alumno.co_grupo = grupo.id " +
            //" WHERE asistencia.fecha = current_date AND asistencia.hora_salida is null AND alumno.eliminado=false " +
            " WHERE asistencia.hora_salida is null AND alumno.eliminado=false " +
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

        pool.query(
            `SELECT 
                    grupo.nombre as nombre_grupo,
                    false as visible,
					a.*
             FROM co_alumno a INNER JOIN co_grupo grupo ON a.co_grupo = grupo.id		
              WHERE a.id not in (
                           SELECT asistencia.co_alumno
                               FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno=alumno.id            
                               WHERE asistencia.hora_salida is null and  asistencia.eliminado = false 
              AND alumno.co_sucursal = $1
              AND asistencia.eliminado=false
            ) 
             AND a.co_sucursal = $2
             AND a.eliminado = false 
             ORDER BY a.nombre ASC
            `,
        [id_sucursal, id_sucursal],
        (error, results) => {
            if (error) {
                handle.callbackError(error, response);
                return;
            }
            response.status(200).json(results.rows);
        });

       /* pool.query("SELECT a.*" +
            " FROM co_alumno a " +
            "  WHERE id not in (" +
            "               SELECT asistencia.co_alumno" +
            "                   FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno=alumno.id" +
            //"                   WHERE asistencia.fecha = current_date AND asistencia.hora_salida is null   " +
            "                   WHERE asistencia.hora_salida is null and  asistencia.eliminado = false " +
            "  AND alumno.co_sucursal = $1" +
            "  AND asistencia.eliminado=false" +
            ") " +
            " AND a.co_sucursal = $2 " +
            " AND a.eliminado = false " +
            " ORDER BY a.hora_entrada ASC",
            [id_sucursal, id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });*/
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

        const { ids, genero } = request.body;

        var idsAlumnos = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsAlumnos += (element + "");
                first = false;
            } else {
                idsAlumnos += (',' + element);
            }
        });

        console.log("Ids registrar entrada  "+idsAlumnos);

        pool.query("select registrar_entrada_alumno('"+idsAlumnos+"',"+genero+");",
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

/*
const registrarEntradaAlumnos = (request, response) => {
    console.log("@registrarEntrada");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { ids, genero } = request.body;

        var sqlComplete = " values ";

        for (var i = 0; i < ids.length; i++) {

            if (i > 0) {
                sqlComplete += ",";
            }

            sqlComplete += "(getDate('')," + ids[i] + ",(getDate('')+getHora(''))::timestamp," + genero + "," + genero + ")";
        };

        console.log("Ids para calcular horas extras ");

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
};*/

const registrarSalidaAlumnos = (request, response) => {
    console.log("@registrarSalidaAlumnos");

    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { ids, genero } = request.body;

        console.log("IDS recibidos " + ids);
        // obtener para el proceso de horas extras
        var idsForHorasExtras = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsForHorasExtras += (element + "");
                first = false;
            } else {
                idsForHorasExtras += (',' + element);
            }
        });

        console.log(" === > " + idsForHorasExtras);

        pool.query("SELECT registrar_salida_alumno('"+idsForHorasExtras+"',"+genero+");")           
            .then((results) => {
                console.log("Resultafdo "+JSON.stringify(results));

                response.status(200).json(results.rowCount);
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });

        // Jala 
        /*pool.query("UPDATE CO_ASISTENCIA " +
            " SET hora_salida = (getDate('')+getHora(''))::timestamp," +
            "  modifico = $1 " +
            " WHERE id IN " + sqlComplete,
            [genero])
            .then((results) => {
                console.log("Resultafdo "+JSON.stringify(results));

                if (results.rowCount > 0) {

                    ejecutarProcedimientoCalculoHorasExtra(idsForHorasExtras, genero);
                }

                response.status(200).json(results.rowCount);
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });*/
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const ejecutarProcedimientoCalculoHorasExtra = (ids_alumnos, id_genero) => {
    console.log("@ejecutarProcedimeintoCalculoHorasExtra");

    try {

        console.log("IDS recibidos " + ids_alumnos);

        pool.query("SELECT generar_horas_extras_alumno('" + ids_alumnos + "'," + id_genero + ");",
            (error, results) => {
                if (error) {
                    console.log("Error al ejecutar el procedimiento calculo extra " + error);
                    return;
                }
                console.log("Se ejecuto el procedimiento de horas extras " + JSON.stringify(results));               
            });
    } catch (e) {
        console.log("Error al ejecutar el procedimiento calculo extra " + e);
    }
};



module.exports = {
    getAlumnosRecibidos,
    getAlumnosPorRecibir,
    registrarEntradaAlumnos,
    registrarSalidaAlumnos
}