
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

var schedule = require('node-schedule');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

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

/*
var taskGenerarBalanceAlumnos = schedule.scheduleJob('1 0 * * *', function(){    
    console.log("Se generan los registros de balances ");
    generarBalanceAlumnos();
});*/

/*
var everyFiveMin = schedule.scheduleJob('1 * * *', function(fireDate){
    console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
  });*/



//Registrar horas extras
const ejecutarProcesoHorasExtrasAuto = () => {
    console.log("==============================PROCESO DE HORAS EXTRAS===================================");
    console.log("@registrarHorasExtrasAuto");

    new Promise((resolve, reject) => {
        try {
            pool.query("select generar_horas_extras();",
                (error, results) => {
                    if (error) {

                        reject(null);
                    }
                    console.log("Se llamo a la function de generar horas extras " + results);
                    resolve(true);
                });
        } catch (e) {
            console.log("Error al correr el proceso de generacion de horas extras " + e);
            reject(null);
        }
    }).then((res) => {
        console.log("Siguiente paso ");
        if (res) {
            console.log("Iniciando el envio de mensajes ");

            //enviar mensaje
            try {
                pool.query("select id,fecha,titulo,cuerpo,icon,token from si_notificacion where notificado = false and fallo = false and eliminado = false",
                    (error, results) => {
                        if (error) {
                            console.log("Error en la consulta de notificaciones ");
                            return;
                        }
                        if (results != null && results.rowCount > 0) {
                            new Promise((resolve, reject) => {
                                var lista = [];
                                //results.rows.forEach(e => {
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
                                //});
                                //  console.log("antes de dar resolve "+JSON.stringify(lista));
                                resolve(lista);
                            }).then((list) => {
                                console.log("Resolve THEN " + JSON.stringify(list));
                            }).catch((e) => {
                                console.log("Error al enviar mensajes en el for de envios " + e);
                                reject(null);
                            });
                        } else { console.log("NO EXISTEN MENSAJES POR ENVIAR"); }
                    });

            } catch (e) {
                console.log("Error al correr el proceso de generacion de horas extras " + e);
                reject(null);
            }
        }
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
        pool.query(" SELECT alumno.id," +
            " alumno.nombre||' '||alumno.apellidos as nombre," +
            " alumno.co_sucursal, " +
            " alumno.hora_salida,	" +
            " age((getDate('')+alumno.hora_salida)::timestamp,(getDate('')+getHora(''))::timestamp) as tiempo_faltante," +
            " (alumno.hora_salida - getHora('')) <= interval '30 minutes' as notificar_proxima_salida" +
            " FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id" +
            " WHERE asistencia.hora_salida is null  and asistencia.fecha = getDate('')                       " +
            " AND (alumno.hora_salida - getHora('')) <= interval '30 minutes'" +
            "   AND alumno.co_sucursal = $1" +
            "   AND (alumno.hora_salida - getHora('')) >= interval '1 minute'" +
            "   AND alumno.eliminado=false " +
            " ORDER BY alumno.hora_salida DESC",
            [co_sucursal],
            (error, results) => {
                if (error) {
                    console.log("Error en query alumnos enviar notificacion proxima salir " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    console.log("inciando envio de notificaciones ");
                    var ID_TEMA_SALIDA_ALUMNO = 3;
                    mensajeria.enviarMensajePorTema(results.rows, ID_TEMA_SALIDA_ALUMNO, co_sucursal,
                        (token, alumno) => {
                            mensajeria.enviarMensajeToken(
                                token,
                                alumno.nombre + " esta proximo a salir.",
                                "Faltan " + alumno.tiempo_faltante + " para la salida del alumno.")
                                .then((response) => {
                                    console.log("Envio correcto notificacion proximo salir ok " + response);
                                }).catch((e) => {
                                    console.log("Error en la mensajeria " + e);
                                });
                        }
                    );

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
        pool.query(" 	 SELECT alumno.id," +
            " alumno.nombre||' '||alumno.apellidos as nombre," +
            " alumno.co_sucursal, " +
            " alumno.hora_salida,	" +
            " (alumno.hora_salida <= getHora('')) as notificar_tiempo_expirado," +
            " getHora('') - alumno.hora_salida as tiempo_expirado					" +
            " FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id                              " +
            " WHERE asistencia.hora_salida is null  and asistencia.fecha = getDate('')" +
            " AND alumno.co_sucursal = $1" +
            " AND (getHora('') - alumno.hora_salida) >= interval '1 minute'" +
            "                AND alumno.eliminado=false" +
            " ORDER BY alumno.hora_salida DESC",
            [co_sucursal],                       
            (error, results) => {
                if (error) {
                    console.log("Error al enviar notificacion tiempo expirado " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    console.log("inciando envio de notificaciones de tiempo expirado ");
                    var ID_TEMA_SALIDA_ALUMNO = 3;
                    mensajeria.enviarMensajePorTema(results.rows, ID_TEMA_SALIDA_ALUMNO, co_sucursal,
                        (token, alumno) => {
                            console.log("JSO "+JSON.stringify(alumno));
                            mensajeria.enviarMensajeToken(
                                token,
                                alumno.nombre + " aun no ha salido.",
                                " Tiempo después de su hora de salida " + alumno.tiempo_expirado+".")
                                .then((response) => {
                                    console.log("Envio correcto notificacion expirado ok " + response);
                                }).catch((e) => {
                                    console.log("Error en la mensajeria " + e);
                                });
                        }
                    );

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
                        console.log("inciando envio de notificaciones por sucursal "+e.nombre);
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
                        console.log("inciando envio de  expiracion notificaciones por sucursal "+e.nombre);                        
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



module.exports = {
    //generarBalanceAlumnos
    ejecutarProcesoHorasExtrasAuto,
    ejecutarProcesoNotificacionProximaSalidaAlumno,
    ejecutarProcesoNotificacionExpiracionTiempoAlumno
}