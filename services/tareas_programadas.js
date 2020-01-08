
const { pool } = require('../db/conexion');

const { dbParams } = require('../config/configJwt');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');


var schedule = require('node-schedule');


/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/
/*
const generarBalanceAlumnos = () => {
    console.log("@generarBalanceAlumnos");
    try {

        console.log("=====>> INICIANDO PROCESO PARA GENERAR BALANCES DE ALUMNOS <<=====");
                   
        pool.query("select iniciar_balance_mensual_alumnos();",                                           
            (error, results) => {
                if (error) {
                    console.log(" Error al invocar la funcion de balances de alumnos "+error);
                    return;
                }                
                console.log("Invocacion correcta a la generacion de balances de alumnos ");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        console.log("Error al invocar el proceso automatico de generacion de balances de alumnos "+e);
        
    }
};*/


//Registrar horas extras

const ejecutarProcesoHorasExtrasAuto = () => {
    console.log("==============================PROCESO DE HORAS EXTRAS===================================");
    console.log("@registrarHorasExtrasAuto");

    pool.query("select generar_horas_extras();")
        .then((results) => {
            
            if (results.rowCount > 0) {
                console.log("Iniciando el envio de mensajes ");

                //enviar mensaje
                pool.query("select id,fecha,titulo,cuerpo,icon,token from si_notificacion where notificado = false and fallo = false and eliminado = false")
                    .then((results) => {
                        if (results != null && results.rowCount > 0) {

                            for (var i = 0; i < results.rows.length; i++) {
                                var e = results.rows[i];
                                console.log("Enviando mensaje ");

                                mensajeria.enviarMensajeToken(e.token, e.titulo, e.cuerpo)
                                    .then((response) => {
                                        console.log("Envio correcto");
                                        console.log("mensaje " + JSON.stringify(response));
                                        silenciarNotificaciones(e.id, (response.successCount > 0), response.results[0].messageId, false);

                                    }).catch((e) => {
                                        console.log("Error en la mensajeria " + e);
                                        silenciarNotificaciones(e.id, false, "Error:" + e, true);

                                    });

                            }
                        } else { console.log("NO EXISTEN MENSAJES POR ENVIAR"); }
                    }).catch((e) => {
                        console.log("Error al correr el proceso de generacion de horas extras " + e);
                    });
            }
        }).catch((e) => {
            console.log("EXCEPCION AL EJECUTAR EL PROCESO AUTOMATICO DE GENERAR HORAS EXTRAS " + e);
        });    
};

//FIXME: falta modificar el procedimiento para guardar las respuestas

const silenciarNotificaciones = (idNotificacion, resultado, mensajeIdRespuesta, fallo) => {

    console.log(" idNotificacion,resultado,mensajeIdRespuesta,fallo " + idNotificacion + "   - " + resultado + "   - " + mensajeIdRespuesta + "   - " + fallo);

    if (idNotificacion == null ||
        idNotificacion == undefined) {
        console.log("El id de la notificacion es null  ");
        return;
    }

    try {
        //pool.query("select silenciar_notificaciones('" + ids + "','" + respuestas + "','" + (mensajes_ids == undefined ? '':mensajes_ids) + "');",
        pool.query("UPDATE SI_NOTIFICACION SET 	notificado = $2, " +
            " mensajeId = $3," +
            " fallo=$4," +
            " fecha_modifico = (getDate('')+getHora(''))::timestamp" +
            " where id =  $1;",
            [idNotificacion,
                (resultado == undefined ? true : resultado),
                (mensajeIdRespuesta == undefined ? '' : mensajeIdRespuesta),
                (fallo == undefined ? true : fallo)
            ],
            (error, results) => {
                if (error) {
                    console.log("ERROR al silenciar notificaciones " + error);
                }
                console.log("Se llamo a la function para silenciar las notificaciones " + JSON.stringify(results));
                console.log("TODO BIEN AL MODIFICAR LA NOTIFICACION");
            });
    } catch (e) {
        console.log("Error al correr el proceso de silenciar las notificaciones " + e);
    }


};

const ejecutarProcesoNotificacionProximaSalidaAlumnoPorSucursal = (co_sucursal) => {

    //Obtiene los alumnos con que tengan 30 o menos minutos proximos a salir
    try {
        pool.query(
            `
            with correos as (
                SELECT  	
                        a.id as id_alumno,
                        a.nombre as nombre_alumno,		 
                        string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                        array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                        array_to_json(array_agg(to_json(coalesce(fam.token,'') ))) as tokens
             FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                                    inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                                    inner join co_alumno a on a.id = rel.co_alumno
                WHERE a.co_sucursal = $1
                     --and envio_recibos -- id_alumnos
                    and co_parentesco in (1,2) -- solo papa y mama
                    and fam.eliminado = false 
                    and rel.eliminado = false
                group by a.nombre,a.id
            ) SELECT
                    alumno.id,
                    alumno.nombre,
                    alumno.co_sucursal, 
                    alumno.hora_salida,			
                    to_char(
                        age((getDate('')+alumno.hora_salida)::timestamp,(getDate('')+getHora(''))::timestamp)					
                        ,'HH24:MI')
                    as tiempo_faltante,
                    EXTRACT(hour from 
                        age((getDate('')+alumno.hora_salida)::timestamp,(getDate('')+getHora(''))::timestamp))
                        as tiempo_faltante_horas,																			 
                    EXTRACT(minute from 
                        age((getDate('')+alumno.hora_salida)::timestamp,(getDate('')+getHora(''))::timestamp))
                        as tiempo_faltante_minutos,
                    (alumno.hora_salida - getHora('')) <= interval '30 minutes' as notificar_proxima_salida,
                    c.nombres_padres,
                    c.correos,
                    c.tokens
                 FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id
                                                inner join correos c on c.id_alumno = alumno.id
                 WHERE asistencia.hora_salida is null  and asistencia.fecha = getDate('')                    
                   AND (alumno.hora_salida - getHora('')) <= interval '30 minutes'
                   AND alumno.co_sucursal = $2
                   AND (alumno.hora_salida - getHora('')) >= interval '1 minute'
                   AND alumno.eliminado=false 
                 ORDER BY alumno.hora_salida DESC
            `,
            [co_sucursal, co_sucursal],
            (error, results) => {
                if (error) {
                    console.log("Error en query alumnos enviar notificacion proxima salir " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    console.log("inciando envio de notificaciones ");
                    var ID_TEMA_SALIDA_ALUMNO = 3;
                    let mensaje_usuario_tema = "";

                    results.rows.forEach(e => {
                        let titulo = e.nombre + " te espera ";
                        let mensaje = "Hola "+e.nombres_padres+", "
                                        + e.nombre+" te espera, faltan "+(e.tiempo_faltante_horas > 0 ? (e.tiempo_faltante_horas+" hora"+(e.tiempo_faltante_horas > 1 ? "s":"")):" ")
                                        +e.tiempo_faltante_minutos+" minuto"+(e.tiempo_faltante_minutos > 0 ? "s":" ")+ " para su hora de salida.";
                        mensajeria.enviarMensajeToken(e.tokens, titulo, mensaje);
                        if (mensaje_usuario_tema == "") {
                            mensaje_usuario_tema += e.nombre;
                        } else {
                            mensaje_usuario_tema += ("," + e.nombre);
                        }
                    });
                    mensaje_usuario_tema += ".";
                    //enviar mensaje a la miss
                    //titulo,mensaje,id_tema, co_sucursal
                    console.log("Enviando mensaje a la mis de proximos a salir");
                    mensajeria.enviarMensajePorTema("Alumnos próximos a salir", mensaje_usuario_tema, ID_TEMA_SALIDA_ALUMNO, co_sucursal);

                } else {
                    console.log("No existen alumnos proximos  a salir ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }
};



const ejecutarProcesoNotificacionExpiracionSalidaAlumnoPorSucursal = (co_sucursal) => {
    console.log("@Ejecucion de expiracion de tiempo de alumnos");
    try {
        pool.query(`
				
        	with correos as (	
                SELECT  	
                        a.id as id_alumno,
                        a.nombre as nombre_alumno,		 
                        string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                        array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                        array_to_json(array_agg(to_json(coalesce(fam.token,'') ))) as tokens
            FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                            inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                            inner join co_alumno a on a.id = rel.co_alumno
            WHERE a.co_sucursal = $1
                 --and envio_recibos -- id_alumnos
                    and co_parentesco in (1,2) -- solo papa y mama
                    and fam.eliminado = false 
                    and rel.eliminado = false
                group by a.nombre,a.id
        )	
        SELECT 
            alumno.id,
            alumno.nombre,
            alumno.co_sucursal, 
            to_char(alumno.hora_salida,'hh:mm AM') AS hora_salida,	
            (alumno.hora_salida <= getHora('')) AS notificar_tiempo_expirado,					
            (date_trunc('minute',(getHora('') - alumno.hora_salida))) as tiempo_expirado,			 
            EXTRACT(hour from 
               (date_trunc('minute',(getHora('') - alumno.hora_salida)))) 
            as tiempo_expirado_horas,					
            EXTRACT(minute from 
               (date_trunc('minute',(getHora('') - alumno.hora_salida))))
            as tiempo_expirado_minutos,			  
            c.nombres_padres,
            c.correos,
            c.tokens
        FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id                              
                                        inner join correos c on c.id_alumno = alumno.id
        WHERE asistencia.hora_salida is null  and asistencia.fecha = getDate('')
                 AND alumno.co_sucursal = $2
                 AND (getHora('') - alumno.hora_salida) >= interval '1 minute'
                 AND alumno.eliminado=false
         ORDER BY alumno.hora_salida DESC
        `,
            [co_sucursal,co_sucursal],
            (error, results) => {
                if (error) {
                    console.log("Error al enviar notificacion tiempo expirado " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    console.log("inciando envio de notificaciones de tiempo expirado ");
                    var ID_TEMA_SALIDA_ALUMNO = 3;

                    let mensaje_usuario_tema = "";

                    results.rows.forEach(e => {                        
                        let titulo = e.nombre + " te espera ";
                        let mensaje = "Hola "+e.nombres_padres+", "
                                        +e.nombre+" tiene " + (e.tiempo_expirado_hora > 0 ? e.tiempo_expirado_horas+" hora"+(e.tiempo_expirado_horas>1?"s":""):" ") 
                                        +(e.tiempo_expirado_minutos > 0 ? (e.tiempo_expirado_minutos+(" minuto"+(e.tiempo_expirado_minutos > 1 ? "s":""))):" ") +" de tiempo extra.";
                        mensajeria.enviarMensajeToken(e.tokens, titulo, mensaje);
                        if (mensaje_usuario_tema == "") {
                            mensaje_usuario_tema += e.nombre;
                        } else {
                            mensaje_usuario_tema += ("," + e.nombre);
                        }
                    });
                    mensaje_usuario_tema += ".";
                    //enviar mensaje a la miss
                    //titulo,mensaje,id_tema, co_sucursal
                    console.log("Enviando mensaje a la miss de alumnos sin salir");
                    mensajeria.enviarMensajePorTema("Alumnos con tiempo expirado ", mensaje_usuario_tema, ID_TEMA_SALIDA_ALUMNO, co_sucursal);

                } else {
                    console.log("No existen alumnos proximos  a salir ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }
};


const ejecutarProcesoNotificacionProximaSalidaAlumno = () => {

    try {
        pool.query(" select * from co_sucursal where eliminado = false",
            (error, results) => {
                if (error) {
                    console.log("Error al enviar notificacion proxima salir " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    results.rows.forEach(e => {
                        console.log("inciando envio de notificaciones por sucursal " + e.nombre);
                        ejecutarProcesoNotificacionProximaSalidaAlumnoPorSucursal(e.id);

                    });
                } else {
                    console.log("No existen sucursales ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }
};


const ejecutarProcesoNotificacionExpiracionTiempoAlumno = () => {

    try {
        pool.query(" select * from co_sucursal where eliminado = false",
            (error, results) => {
                if (error) {
                    console.log("Error al enviar notificacion de expiracion salir " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    results.rows.forEach(e => {
                        console.log("inciando envio de  expiracion notificaciones por sucursal " + e.nombre);
                        ejecutarProcesoNotificacionExpiracionSalidaAlumnoPorSucursal(e.id);
                    });
                } else {
                    console.log("No existen sucursales ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }
};


const ejecutarRegistroMensualidadAutomatica = () => {
    console.log("==============================PROCESO DE HORAS EXTRAS===================================");
    console.log("@ejecutarRegistroMensualidadAutomatica");

    pool.query("select registrar_cargo_mensualidad_alumnos();")
        .then((results) => {
            console.log("Ejecucion del proceso de cargos de mensualidades automaticas ejecutado");
        }).catch((e) => {
            console.log("EXCEPCION AL EJECUTAR EL PROCESO AUTOMATICO DE CARGOS DE MENSUALIDAD " + e);
        });
}

//proceso de calculo de cargo extra por fecha limite de pago
const ejecutarProcesoCalculoCargoExtraFechaLimitePagoMensualidad= ()=>{
    try {
        pool.query(" select * from co_sucursal where eliminado = false",
            (error, results) => {
                if (error) {
                    console.log("Error al enviar notificacion de expiracion salir " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    results.rows.forEach(e => {
                        console.log("inciando envio de  expiracion notificaciones por sucursal " + e.nombre);
                       
                    });
                } else {
                    console.log("No existen sucursales ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }
};

module.exports = {
    //generarBalanceAlumnos
    ejecutarProcesoHorasExtrasAuto,
    ejecutarProcesoNotificacionProximaSalidaAlumno,
    ejecutarProcesoNotificacionExpiracionTiempoAlumno,
    ejecutarRegistroMensualidadAutomatica
}