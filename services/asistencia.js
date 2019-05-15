
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');


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
    try {

        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });


        pool.query("select asistencia.id," +
            "asistencia.fecha," +
            "asistencia.hora_entrada," +
            "asistencia.hora_salida," +
            "alumno.id as id_alumno," +
            "alumno.nombre as nombre_alumno,	 " +
            "alumno.apellidos as apellido_alumno " +
            " from co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id " +
            " WHERE asistencia.fecha = current_date AND asistencia.hora_salida is null AND alumno.eliminado=false " +
            " ORDER BY asistencia.hora_entrada DESC",
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
    try {

        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });


        pool.query("select a.* " +
            " from co_alumno a " +
            " where id not in (select co_alumno" +
            " from co_asistencia " +
            " where fecha = current_date AND hora_salida is null and eliminado=false) AND a.eliminado = false",
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
    console.log("insert lista alumnos");
    try {


        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });


        const { ids } = request.body;

        var id_usuario = 1;

        var sqlComplete = " values ";
        for (var i = 0; i < ids.length; i++) {

            if (i > 0) {
                sqlComplete += ",";
            }
            sqlComplete += "(current_date," + ids[i] + ",current_time," + id_usuario + "," + id_usuario + ")";
        };

        pool.query("INSERT INTO CO_ASISTENCIA(fecha,co_alumno,hora_entrada,usuario,genero) " +
            sqlComplete,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const registrarSalidaAlumnos = (request, response) => {
    console.log("registrar salida lista alumnos");

    try {
        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });


        const { ids } = request.body;

        var id_usuario = 1;

        var sqlComplete = " ( ";
        for (var i = 0; i < ids.length; i++) {

            if (i > 0) {
                sqlComplete += ",";
            }
            sqlComplete += "" + ids[i];
        };
        sqlComplete += ")";

        pool.query("UPDATE CO_ASISTENCIA set hora_salida = current_time " +
            " WHERE id IN " + sqlComplete,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows)
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