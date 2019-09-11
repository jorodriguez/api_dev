
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

const ENTRADA = 0;
const SALIDA = 1;

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
                
                if(results.rowCount > 0){
                    //Enviar mensaje de recepcion
                    enviarMensajeEntradaSalida(ids,results.rows,ENTRADA);
                }

                response.status(200).json(results.rowCount);
            });
            
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};

function enviarMensajeEntradaSalida(ids_alumnos,ids_asistencias,operacion){
    console.log("ids_al "+ids_alumnos+" ids asis  "+ids_asistencias+" "+operacion);
    if(ids_alumnos == undefined || ids_alumnos == null || ids_asistencias == undefined || ids_asistencias == null){
        console.log("Las listas son null");
        return;
    }

    pool.query(`with correos as (
        SELECT  	
                    a.id as id_alumno,
                    a.nombre as nombre_alumno,		 
                    string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                    array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                    array_to_json(array_agg(to_json(fam.token))) as tokens
         FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                                inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                                inner join co_alumno a on a.id = rel.co_alumno
        WHERE co_alumno = ANY($1::int[]) --and envio_recibos -- id_alumnos
                and co_parentesco in (1,2) -- solo papa y mama
                and fam.eliminado = false 
                and rel.eliminado = false
        group by a.nombre,a.id
    )select 
            al.nombre,
            a.fecha,
            a.hora_entrada,
            c.correos,
            c.nombres_padres,
            c.tokens
        from co_asistencia a inner join co_alumno al on a.co_alumno = al.id
                                left join correos c on c.id_alumno = al.id
        where a.id = ANY(2$::int[])	 -- id_asistencia 		 
              AND a.eliminado = false
              AND al.eliminado = false`, 
        [ids_alumnos,ids_asistencias],
        (error, results) => {
            if (error) {
                handle.callbackError(error, response);
                return;
            }
            console.log("result " + JSON.stringify(results));
            if (results.rowCount > 0) {                
                let asistencias = results.rows;                
                asistencias.forEach(e=>{
                    let titulo_mensaje = (operacion == ENTRADA ? "Entrada de "+e.nombre:"Salida de "+e.nombre); 
                    let mensaje_entrada = "Hola, "+ e.nombre_padres +" recibimos a "+e.nombre+" a las "+e.hora_entrada+".";
                    let mensaje_salida = "Hola, "+ e.nombre_padres+" entregamos a "+e.nombre+" a las "+e.hora_entrada+".";
                    let cuerpo_mensaje = (operacion == ENTRADA ? mensaje_entrada:mensaje_salida);

                    //token,titulo,cuerpo
                   mensajeria.enviarMensajeToken(e.tokens,titulo_mensaje,cuerpo_mensaje);
                   //Enviar correo
                });                   
            }
        });	
}

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

        pool.query("SELECT registrar_salida_alumno('"+idsAsistencias+"',"+genero+");")           
            .then((results) => {
                console.log("Resultado "+JSON.stringify(results));
                if(results.rowCount > 0 ){
                    //enviarMensajeEntradaSalida(ids,,SALIDA);
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
