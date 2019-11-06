
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

const ENTRADA = 0;
const SALIDA = 1;

//FIXME : agregar el parametro de fecha
const getAlumnosRecibidos = (request, response) => {
    console.log("@getAlumnosRecibidos");
    try {
        // validarToken(request,response);

        console.log("Iniciando consulta de alumno ");

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
            " ORDER BY alumno.nombre ASC",
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
        // validarToken(request,response);

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

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const registrarEntradaAlumnos = (request, response) => {
    console.log("@registrarEntrada");
    try {
        // validarToken(request,response);

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

        console.log("Ids registrar entrada  " + idsAlumnos);

        pool.query("select registrar_entrada_alumno('" + idsAlumnos + "'," + genero + ");",
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {
                    //Enviar mensaje de recepcion
                    console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                    var listaIdsAsistencias = results.rows.map(e => e.registrar_entrada_alumno);
                    enviarMensajeEntradaSalida(listaIdsAsistencias, ENTRADA);
                }

                response.status(200).json(results.rowCount);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};

function enviarMensajeEntradaSalida(ids_asistencias, operacion) {
    console.log(" ids asis  " + ids_asistencias + " operacion " + operacion);
    try {
        if (ids_asistencias == undefined || ids_asistencias == null) {
            console.log("La lista de ids de asistencia es null");
            return;
        }
        console.log("iniciando el proceso de envio de mensajeria ");
        pool.query(`with correos as (
        SELECT  	
                    a.id as id_alumno,
                    a.nombre as nombre_alumno,		 
                    string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                    array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                    array_to_json(array_agg(to_json(coalesce(fam.token,'') ))) as tokens
         FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                                inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                                inner join co_alumno a on a.id = rel.co_alumno
        WHERE a.id IN (select co_alumno from co_asistencia where id = ANY($1::int[])) --PARAMETRO
                 --and envio_recibos -- id_alumnos
                and co_parentesco in (1,2) -- solo papa y mama
                and fam.eliminado = false 
                and rel.eliminado = false
        group by a.nombre,a.id
    )select 
            al.nombre,
            to_char(a.fecha,'DD-MM-YYYY')       AS fecha,	
            extract(dow from a.fecha)::integer  AS num_dia,
            to_char(a.fecha,'MM')::integer      AS num_mes,		
            to_char(a.fecha,'YY')               AS anio_label,
            to_char(a.hora_entrada,'hh:mm AM')  AS hora_entrada,
            to_char(a.hora_salida,'hh:mm AM')  AS hora_salida,
            c.correos,
            c.nombres_padres,
            c.tokens
        from co_asistencia a inner join co_alumno al on a.co_alumno = al.id
                                left join correos c on c.id_alumno = al.id
        where a.id = ANY($2::int[])	 -- IDS DE ASISTENCIAS	 
              AND a.eliminado = false
              AND al.eliminado = false`,
            [ids_asistencias, ids_asistencias],
            (error, results) => {
                if (error) {
                    console.log("Excepcion en el query al enviar los mensajes " + error);
                    return;
                }
                console.log("result " + JSON.stringify(results));
                if (results.rowCount > 0) {
                    let asistencias = results.rows;
                    asistencias.forEach(e => {
                        let titulo_mensaje = (operacion == ENTRADA ? "Entrada de " + e.nombre : "Salida de " + e.nombre);
                        let mensaje_entrada = "Hola, " + e.nombres_padres + " recibimos a " + e.nombre + " a las " + e.hora_entrada + ".";
                        let mensaje_salida = "Hola, " + e.nombres_padres + " entregamos a " + e.nombre + " a las " + e.hora_salida + ".";
                        let cuerpo_mensaje = (operacion == ENTRADA ? mensaje_entrada : mensaje_salida);

                        //token,titulo,cuerpo

                        mensajeria.enviarMensajeToken(e.tokens, titulo_mensaje, cuerpo_mensaje);
                        //Enviar correo
                    });
                }
            });

    } catch (e) {
        //handle.callbackErrorNoControlado(e, response);
        console.log("Excepcion no controlada");

    }
}


const registrarSalidaAlumnos = (request, response) => {
    console.log("@registrarSalidaAlumnos");

    try {
        //validarToken(request,response);

        const { ids, genero } = request.body;

        console.log("IDS de asistencia recibidos " + ids);
        // obtener para el proceso de horas extras
        var idsAsistencias = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsAsistencias += (element + "");
                first = false;
            } else {
                idsAsistencias += (',' + element);
            }
        });

        console.log(" === > " + idsAsistencias);

        pool.query("SELECT registrar_salida_alumno('" + idsAsistencias + "'," + genero + ");")
            .then((results) => {
                console.log("Resultado " + JSON.stringify(results));
                if (results.rowCount > 0) {
                    //enviarMensajeEntradaSalida(ids,,SALIDA);
                    enviarMensajeEntradaSalida(ids, SALIDA);
                }
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


const obtenerListaAsistencia = (request, response) => {
    console.log("@obtenerAsistencia");
    try {
        pool.query(`

select fecha,
al.foto,
a.hora_entrada,
a.hora_salida,
al.nombre as nombre_alumno,
al.apellidos as apellido_alumno,
grupo.id as id_grupo,
grupo.nombre as nombre_grupo,
u.nombre usuario_registro,
al.hora_entrada as hora_entra,
al.hora_salida as hora_sale
from co_asistencia a inner join co_alumno al on al.id = a.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join usuario u on u.id = a.usuario
where 
al.co_sucursal = 1 
and a.fecha = getDate('')
and a.eliminado = false
order by  grupo.nombre,al.nombre asc

            `)
            .then((results) => {
                console.log("resultado lista de asistencia");
                if (results.rowCount > 0) {

                }
                response.status(200).json(results.rows);
            }).catch((e) => {
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}




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
