
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const Joi = require('@hapi/joi');

const inscripcion = require('./inscripcion');
const familiar = require('./familiar');
const formato_complemento = require('./formato_complemento');
const balance_alumno = require('./balance_alumno');

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
            "  balance.total_adeudo > 0 As adeuda," +
            " g.nombre as nombre_grupo," +
            " s.nombre as nombre_sucursal" +
            " FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id" +
            "                     inner join co_sucursal s on a.co_sucursal = s.id" +
            "                       left join co_balance_alumno balance on balance.id = a.co_balance_alumno " +
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

        console.log("" + JSON.stringify(p));

        console.log("insertando alumno");
        new Promise((resolve, reject) => {
            pool.query("INSERT INTO CO_ALUMNO(" +
                "co_sucursal,co_grupo," +
                "nombre,apellidos,fecha_nacimiento," +
                "alergias,nota,hora_entrada," +
                "hora_salida,costo_inscripcion,costo_colegiatura," +
                "minutos_gracia,foto,fecha_inscripcion,fecha_reinscripcion," +
                "sexo," +
                "genero" +
                " ) " +
                " VALUES(" +
                " $1,$2,$3," +
                " $4,$5,$6," +
                " $7,$8,$9," +
                " $10,$11,$12," +
                " $13,$14,(getDate('') + interval '1 year'),$15,$16" +
                ") RETURNING id;"
                , [
                    p.co_sucursal, p.co_grupo,
                    p.nombre, p.apellidos, p.fecha_nacimiento,
                    p.alergias, p.nota, p.hora_entrada,
                    p.hora_salida, p.costo_inscripcion, p.costo_colegiatura,
                    p.minutos_gracia, p.foto, p.fecha_inscripcion,
                    p.sexo,
                    p.genero
                ],
                (error, results) => {
                    if (error) {
                        //handle.callbackError(error, response);
                        //return;
                        reject(error);
                    }
                    if (results && results.rowCount > 0) {

                        resolve(results.rows[0].id);

                    } else {
                        reject(null);
                    }
                    resolve(null);
                });
        }).then((id_alumno) => {
            console.log("alumno creado")
            if (id_alumno != null) {
                inscripcion.createFormatoInscripcionInicial(id_alumno, p.genero)
                    .then((id_formato) => {
                        //invocar
                        inscripcion.actualizarFormatoAlumno(id_alumno, id_formato).then((id) => {
                            response.status(200).json(id_alumno);
                        }).catch((e) => {
                            handle.callbackError(e, response);
                        });
                    }).catch((e) => {
                        handle.callbackError(e, response);
                    });

                //generare el balanceconsol
                console.log("Iniciando crear el balance ");
                balance_alumno.registrarBalanceAlumno(id_alumno, genero);

            } else {
                response.status(200).json(0);
            }
        }).catch((e) => {
            handle.callbackError(e, response);
            //response.status(200).json(0);
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

        const alumno = request.body;

        console.log(" CCCC " + JSON.stringify(alumno));

        const formato = alumno.formato_inscripcion;

        //const padre = alumno.padre;

        //const madre = alumno.madre;

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
                "modifico = $17, " +
                "fecha_inscripcion = $18 " +
                " WHERE id = $1",
                [
                    id,
                    alumno.nombre, alumno.apellidos, (alumno.fecha_nacimiento == "" ? null : alumno.fecha_nacimiento), alumno.alergias,
                    alumno.nota, alumno.hora_entrada, alumno.hora_salida,
                    alumno.costo_inscripcion, alumno.costo_colegiatura, alumno.minutos_gracia,
                    alumno.foto, (alumno.fecha_reinscripcion == "" ? null : alumno.fecha_reinscripcion),
                    alumno.co_grupo, alumno.nombre_carino,
                    alumno.sexo, alumno.genero,
                    (alumno.fecha_inscripcion == "" ? null : alumno.fecha_inscripcion)
                ],
                (error, results) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(true);
                });

        }).then((estado) => {
            if (estado) {
                console.log("Se procede a modificar el formato");
                inscripcion.updateInscripcion(formato).then((id) => {
                    if (id != null) {
                        formato_complemento.actualizarValoresEsperados(formato);

                        response.status(200).send(`${id}`)
                    } else {
                        handle.callbackError("Error al intentar actualizar la inscripcion", response);
                    }
                }).catch((e) => {
                    reject(e);
                    handle.callbackError(error, response);
                });
            }

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
            `
            SELECT a.*,
                g.nombre as nombre_grupo,
                s.nombre as nombre_sucursal,
                to_json(f.*) as formato_inscripcion,
                coalesce(to_json(datos_facturacion.*),'{}'::json) as datos_facturacion
            FROM co_alumno a inner join co_grupo g on a.co_grupo = g.id
                     inner join co_sucursal s on a.co_sucursal = s.id
                       left join co_formato_inscripcion f on a.co_formato_inscripcion = f.id
                       left join co_datos_facturacion datos_facturacion on a.co_datos_facturacion = datos_facturacion.id
            WHERE a.id = $1 AND a.eliminado=false ORDER BY a.nombre ASC
        `,[id],
            (error, results) => {
                if (error) {
                    console.log("Error en getAlumnoid " + error);
                    response.status(400).json({});
                    return;
                }
                if (results.rowCount > 0) {

                    var alumno = results.rows[0];

                    //                    console.log(" Alumno encontrado " + JSON.stringify(alumno));

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