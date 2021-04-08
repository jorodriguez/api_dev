
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const { isEmptyOrNull } = require('../utils/Utils');
//const Joi = require('@hapi/joi');

const alumnoService = require('../domain/alumnoService');
const inscripcion = require('./inscripcion');
const {ExceptionDatosFaltantes} = require('../exception/exeption');
const formato_complemento = require('./formato_complemento');
const balance_alumno = require('./balance_alumno');

//GET—/alumnos/:id_sucursal | getAlumnos()
const getAlumnos = (request, response) => {
    console.log("@getAlumnos");
    try {
       
        //validarToken(request,response);

        console.log("paso token getAlumnos");

        const id_sucursal = parseInt(request.params.id_sucursal);

        console.log("Consultando alumnos de la suc " + id_sucursal);

        pool.query(
            "SELECT a.*," +
            "  balance.total_adeudo > 0 As adeuda," +
            " g.nombre as nombre_grupo," +
            " g.color as color," +
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
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const createAlumno = (request, response) => {
    console.log("@create alumno");
    try {
        //validarToken(request,response);

        const p = getParams(request.body);

        console.log("" + JSON.stringify(p));

        console.log("insertando alumno");
        new Promise((resolve, reject) => {
            pool.query(`
                INSERT INTO CO_ALUMNO(
                    co_sucursal,co_grupo,nombre,
                    apellidos,fecha_nacimiento,alergias,
                    nota,hora_entrada,hora_salida,
                    costo_inscripcion,costo_colegiatura,minutos_gracia,
                    foto,fecha_inscripcion,fecha_reinscripcion,                                      
                    sexo,genero,
                    fecha_limite_pago_mensualidad,
                    numero_dia_limite_pago) 
                 VALUES(
                    $1,$2,$3,
                    $4,$5,$6,
                    $7,$8,$9,
                    $10,$11,$12,
                    $13,$14,($14::date + interval '1 year')
                    ,$15,$16
                    ,$17
                    ,to_char($17::date,'dd')::integer             
                ) RETURNING id;`
                , [
                    p.co_sucursal, p.co_grupo, p.nombre, //3
                    p.apellidos, p.fecha_nacimiento,p.alergias,//6 
                    p.nota, p.hora_entrada, p.hora_salida, //9
                    p.costo_inscripcion, p.costo_colegiatura, p.minutos_gracia, //12
                    p.foto, p.fecha_inscripcion,//14
                    p.sexo, p.genero, //16
                    p.fecha_limite_pago_mensualidad //17
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
            console.log("alumno creado");
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
                balance_alumno.registrarBalanceAlumno(id_alumno, p.genero);

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

const modificarFechaLimitePagoMensualidad = (request,response)=>{
        console.log("modificarFechaLimitePagoMensualidad");
        try{

            const { fecha,genero }  = request.body;
            const idAlumno  = request.params.id_alumno;

            if(isEmptyOrNull(idAlumno) || isEmptyOrNull(fecha) || isEmptyOrNull(genero)){
                console.log("Faltan datos");
                
                response.status(200).json(new ExceptionDatosFaltantes("Datos faltantes"));

                return;
            }


            alumnoService
                .modificarFechaLimitePagoMensualidad(idAlumno,fecha,genero)
                .then(result =>{
                    
                    response.status(200).json(result);

                }).catch(error=>{
                    console.error(error);
                    handle.callbackError(error, response);
                });

        }catch(error){
            console.log("Error "+error);
            handle.callbackError(error, response);
        }
};


// PUT—/alumno/:id | updateAlumno()
const updateAlumno = (request, response) => {
    console.log("@updateAlumnos");
    try {

       // validarToken(request,response);

        const id = parseInt(request.params.id);

        const alumno = request.body;

        //console.log(" CCCC " + JSON.stringify(alumno));

        const formato = alumno.formato_inscripcion;

        //const padre = alumno.padre;

        //const madre = alumno.madre;

        //const result = Joi.validate(p, schemaValidacionAlumno);        

        new Promise((resolve, reject) => {
            pool.query(
                `UPDATE CO_ALUMNO  
                SET nombre = $2, 
                apellidos = $3 ,
                fecha_nacimiento = $4::date,
                alergias = $5,
                nota = $6,
                hora_entrada = $7,
                hora_salida=$8,
                costo_inscripcion = $9,
                costo_colegiatura = $10,
                minutos_gracia = $11,
                foto= $12,
                fecha_reinscripcion = $13,
                co_grupo = $14, 
                nombre_carino = $15, 
                mostrar_nombre_carino = $16,
                color = $17,
                sexo = $18,                
                 modifico = $19, 
                fecha_inscripcion = $20
                 WHERE id = $1`,
                [
                    id,
                    alumno.nombre, alumno.apellidos, (alumno.fecha_nacimiento == "" ? null : alumno.fecha_nacimiento), alumno.alergias,
                    alumno.nota, alumno.hora_entrada, alumno.hora_salida,
                    alumno.costo_inscripcion, alumno.costo_colegiatura, alumno.minutos_gracia,
                    alumno.foto, (alumno.fecha_reinscripcion == "" ? null : alumno.fecha_reinscripcion),
                    alumno.co_grupo, alumno.nombre_carino,(alumno.mostrar_nombre_carino || false),
                    (alumno.color || null),
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

                        response.status(200).send(`${id}`);
                    } else {
                        handle.callbackError("Error al intentar actualizar la inscripcion", response);
                    }
                }).catch((e) => {
                    reject(e);
                    handle.callbackError(e, response);
                });
            }

        }).catch((error) => {
            handle.callbackError(error, response);
        });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



// DELETE—/alumnos/:id | deleteAlumno()
const deleteAlumno = (request, response) => {
    console.log("@deleteAlumnos");
    try {
        //validarToken(request,response);

        const id = parseInt(request.params.id)
        pool.query('UPDATE CO_ALUMNO SET eliminado = true WHERE id = $1', [id], (error, results) => {
            if (error) {

                handle.callbackError(error, response);
                return;
            }
            response.status(200).send(`User deleted with ID: ${id}`);
        });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

/*
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
});*/

const getParams = (body) => {

    const parametros = {
        co_sucursal, co_grupo,
        nombre, apellidos, nombre_carino, fecha_nacimiento, sexo,
        alergias, nota, hora_entrada,
        hora_salida, costo_inscripcion, costo_colegiatura,
        minutos_gracia, foto, fecha_inscripcion,
        genero,fecha_limite_pago_mensualidad
    } = body;

    return parametros;
};


//GET—/alumnos | getById()
const getAlumnoById = (request, response) => {
    console.log(" @getAlumnoById");
    try {

        validarToken(request,response);

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
    getAlumnoById,
    modificarFechaLimitePagoMensualidad
};