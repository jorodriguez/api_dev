
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const Joi = require('@hapi/joi');

const config = require('../config/config');
const jwt = require('jsonwebtoken');


const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

//GET — /alumnos/:id_sucursal | getAlumnos()
const getAlumnos = (request, response) => {
    console.log("@getAlumnos");
    try {
        /*var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send(helperToken.noTokenProvider);

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send(msgs.failedAuthenticateToken);
        });*/

        var validacion = helperToken.validarToken(request);
        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("paso token getAlumnos");

        const id_sucursal = parseInt(request.params.id_sucursal);

        console.log("Consultando alumnos de la suc " + id_sucursal);

        pool.query(
            "SELECT a.*," +
            "g.nombre as nombre_grupo," +
            "s.nombre as nombre_sucursal," +
            "padre.nombre as nombre_padre," +
            "madre.nombre as nombre_madre" +
            " FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id" +
            "                     inner join co_sucursal s on a.co_sucursal = s.id" +
            "                    left join co_familiar padre on a.padre = padre.id " +
            "					 left join co_familiar madre on a.madre = madre.id " +
            "WHERE a.co_sucursal = $1 AND a.eliminado=false ORDER BY a.nombre ASC",
            [id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const createAlumno = (request, response) => {
    console.log("@create alumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const p = getParams(request.body);

        /* const result = Joi.validate(p, schemaValidacionAlumno);
 
         if (result.error !== null) {
             response.status(200).json(result.error);
             return;
         }*/

        pool.query("INSERT INTO CO_ALUMNO(" +
            "co_sucursal,co_grupo,padre," +
            "nombre,apellidos,fecha_nacimiento," +
            "alergias,nota,hora_entrada," +
            "hora_salida,costo_inscripcion,costo_colegiatura," +
            "minutos_gracia,foto,fecha_reinscripcion," +
            "genero" +
            ")" +
            "VALUES(" +
            "$1,$2,$3," +
            "$4,$5,$6," +
            "$7,$8,$9," +
            "$10,$11,$12," +
            "$13,$14,$15," +
            "$16" +
            ");"
            , [
                p.co_sucursal, p.co_grupo, 1,
                p.nombre, p.apellidos, p.fecha_nacimiento,
                p.alergias, p.nota, p.hora_entrada,
                p.hora_salida, p.costo_inscripcion, p.costo_colegiatura,
                p.minutos_gracia, p.foto, p.fecha_reinscripcion,
                p.genero
            ],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rowCount)
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



// PUT — /alumno/:id | updateAlumno()
const updateAlumno = (request, response) => {
    console.log("@updateAlumnos");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = parseInt(request.params.id)

        const p = getParams(request.body);

        //const result = Joi.validate(p, schemaValidacionAlumno);
        console.log("f nac " + p.fecha_nacimiento);
        pool.query(
            "UPDATE CO_ALUMNO  " +
            "SET nombre = $2, " +
            "apellidos = $3 ," +
            "fecha_nacimiento = $4::date," +
            "alergias = $5," +
            "nota = $6," +
            "hora_entrada = $7," +
            "hora_salida=$8," +
            "costo_inscripcion = $9," +
            "costo_colegiatura = $10," +
            "minutos_gracia = $11," +
            "foto= $12," +
            "fecha_reinscripcion = $13," +
            "co_grupo = $14 " +
            " WHERE id = $1",
            [
                id,
                p.nombre, p.apellidos, p.fecha_nacimiento, p.alergias, p.nota,
                p.hora_entrada, p.hora_salida, p.costo_inscripcion,
                p.costo_colegiatura, p.minutos_gracia, p.foto, p.fecha_reinscripcion,
                co_grupo
            ],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).send(`User modified with ID: ${id}`)
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

// DELETE — /alumnos/:id | deleteAlumno()
const deleteAlumno = (request, response) => {
    console.log("@deleteAlumnos");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = parseInt(request.params.id)
        pool.query('UPDATE CO_ALUMNO SET eliminado = true WHERE id = $1', [id], (error, results) => {
            if (error) {

                handle.callbackError(error, response);
                return;
            }
            response.status(200).send(`User deleted with ID: ${id}`)
        });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


const schemaValidacionAlumno = Joi.object().keys({
    nombre: Joi.string().required().label('Nombre requerido'),
    co_sucursal: Joi.required(),
    co_grupo: Joi.required(),
    apellidos: Joi.string(),
    fecha_nacimiento: Joi.date().required().label('Fecha de nacimiento requerida'),
    alergias: Joi.string(),
    nota: Joi.string(),
    hora_entrada: Joi.date().timestamp().required().label('Hora de entrada requerida'),
    hora_salida: Joi.date().timestamp().required(),
    costo_inscripcion: Joi.number().positive().min(1).required(),
    costo_colegiatura: Joi.number().positive().required(),
    minutos_gracia: Joi.number(),
    fecha_inscripcion: Joi.date(),
    genero: Joi.required()
});

const getParams = (body) => {

    const parametros = {
        co_sucursal, co_grupo,
        snombre, apellidos, fecha_nacimiento,
        alergias, nota, hora_entrada,
        hora_salida, costo_inscripcion, costo_colegiatura,
        minutos_gracia, foto, fecha_inscripcion,
        genero
    } = body;

    return parametros;
};


//GET — /alumnos | getById()
const getAlumnoById = (request, response) => {
    console.log(" @getAlumnoById");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = parseInt(request.params.id);

        console.log(" Alumno por id = " + id);

        pool.query(
            "SELECT a.*," +
            " g.nombre as nombre_grupo," +
            " s.nombre as nombre_sucursal," +
            " padre.nombre as nombre_padre," +
            " madre.nombre as nombre_madre" +
            " FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id" +
            "                     inner join co_sucursal s on a.co_sucursal = s.id" +
            "                    left join co_familiar padre on a.padre = padre.id " +
            "					 left join co_familiar madre on a.madre = madre.id " +
            " WHERE a.id = $1 AND a.eliminado=false ORDER BY a.nombre ASC",            
            [id],
            (error, results) => {
                if (error) {
                    response.status(400).json({});
                    return;
                }
                if (results.rowCount > 0) {
                    response.status(200).json(results.rows[0]);
                } else {
                    response.status(400).json({});
                }
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getAlumnos,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    getAlumnoById
}