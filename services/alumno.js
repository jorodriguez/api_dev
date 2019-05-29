
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const Joi = require('@hapi/joi');

const inscripcion = require('./inscripcion');
const familiar = require('./familiar');

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
            " g.nombre as nombre_grupo," +
            " s.nombre as nombre_sucursal" +
            " FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id" +
            "                     inner join co_sucursal s on a.co_sucursal = s.id" +
            "  WHERE a.co_sucursal = $1 AND a.eliminado=false ORDER BY a.nombre ASC",
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

        console.log("insertando alumno " + JSON.stringify(p));

        pool.query(" SELECT guardarAlumno("+
        p.co_sucursal + "," +
            p.co_grupo + "," +
            p.nombre + "," +
            p.apellidos + "," +
            p.nombre_carino + "," +
            p.sexo + "," +
            "curret_date", 
            p.alergias + "," +
            p.nota + "," +
            p.hora_entrada + "," +
            p.hora_salida + "," +
            p.costo_inscripcion + "," +
            p.costo_colegiatura + "," +
            p.minutos_gracia + "," +
            p.foto + "," +
            "current_date,"+
            "current_date,"+
            //p.fecha_inscripcion + "," +
            //p.fecha_reinscripcion + "," +,
            p.genero + ");"
            ,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                console.log("RESPUESTA " + JSON.stringify(results));

                response.status(200).json(1);

                /*if (results.rowCount > 0) {

                    response.status(200).json(results.rows[0].id);

                } else {
                    response.status(200).json(0);
                }*/

            });

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

        const id = parseInt(request.params.id);
        console.log("id " + id);
        const alumno = request.body;

        const formato = alumno.formato_inscripcion;

        const padre = alumno.padre;

        const madre = alumno.madre;

        const valores_esperados = alumno.valor

        //const result = Joi.validate(p, schemaValidacionAlumno);        

        new Promise((resolve, reject) => {
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
                "co_grupo = $14, " +
                "nombre_carino = $15, " +
                "sexo = $16 ," +
                "modifico = $17 " +
                " WHERE id = $1",
                [
                    id,
                    alumno.nombre, alumno.apellidos, alumno.fecha_nacimiento, alumno.alergias,
                    alumno.nota, alumno.hora_entrada, alumno.hora_salida,
                    alumno.costo_inscripcion, alumno.costo_colegiatura, alumno.minutos_gracia,
                    alumno.foto, alumno.fecha_reinscripcion, alumno.co_grupo, alumno.nombre_carino,
                    alumno.sexo, alumno.genero
                ],
                (error, results) => {
                    if (error) {
                        reject(error);
                        //return;
                    }
                    console.log("Se procede a modificar el formato");
                    //llamar al otro guardad
                    inscripcion.updateInscripcion(formato).then((estatus) => {
                        if (estatus) {
                            if (alumno.co_padre !== null && !isEmpty(alumno.padre)) {
                                familiar.updateFamiliar(alumno.co_padre, padre, alumno.genero);
                            } else {
                                console.log("alumno.generoalumno.generoalumno.genero" + alumno.genero);
                                familiar.createPadre(alumno.id, padre, alumno.genero);
                            }

                            if (alumno.co_madre !== null && !isEmpty(alumno.madre)) {
                                familiar.updateFamiliar(alumno.co_madre, madre, alumno.genero);
                            } else {
                                familiar.createMadre(alumno.id, madre, alumno.genero);
                            }

                            //actualizar el valor esperado seleccionado
                            inscripcion.relacionarValorEsperadoEmpresa(formato.id);
                        }
                    }).catch((e) => {
                        reject(e);
                    });
                    resolve(true);
                });

        }).then((estado) => {
            response.status(200).send(`User modified with ID: ${id}`)
        }).catch((error) => {
            handle.callbackError(error, response);
        });
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
        nombre, apellidos, nombre_carino, fecha_nacimiento, sexo,
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
            " SELECT a.*," +
            " g.nombre as nombre_grupo," +
            " s.nombre as nombre_sucursal," +
            " to_json(f.*) as formato_inscripcion," +
            " to_json(padre.*) as padre," +
            " to_json(madre.*) as madre" +
            " FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id" +
            "                     inner join co_sucursal s on a.co_sucursal = s.id" +
            "                       left join co_formato_inscripcion f on a.co_formato_inscripcion = f.id" +
            "                       left join co_familiar padre on a.co_padre = padre.id " +
            "                       left join co_familiar madre on a.co_madre = madre.id " +
            " WHERE a.id = $1 AND a.eliminado=false ORDER BY a.nombre ASC",
            [id],            
            (error, results) => {
                if (error) {
                    console.log("Error en getAlumnoid " + error);
                    response.status(400).json({});
                    return;
                }
                if (results.rowCount > 0) {

                    var alumno = results.rows[0];

                    console.log(" Alumno encontrado " + JSON.stringify(alumno));

                    response.status(200).json(alumno);

                } else {
                    response.status(400).json({ alumno: null, formato: null });
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