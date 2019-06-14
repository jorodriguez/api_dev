
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
    console.log("@registrarHorasExtrasAuto");


    new Promise((resolve, reject) => {
        try {
            pool.query("select generar_horas_extras();",
                (error, results) => {
                    if (error) {

                        reject(null);
                    }
                    console.log("Se llamo a la function de generar horas extras ");
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

                                    mensajeria.enviarMensajeToken(e.token, e.titulo, e.cuerpo).then((response) => {
                                        // console.log(" result" + JSON.stringify(response));
                                        console.log("Envio correcto");                                        
                                        console.log("mensaje " + JSON.stringify(e));
                                        lista.push({respuesta:response.messageId,notificado:(response.successCount > 0)});

                                    }).catch((e) => {
                                        console.log("Error en la mensajeria " + e);
                                        //return e;
                                        e.respuesta = '';
                                        e.notificado = false;
                                        lista.push({respuesta:'',notificado:false});
                                    });
                                }
                                //});
                                console.log("antes de dar resolve "+JSON.stringify(lista));
                                resolve(lista);
                            }).then((list) => {
                                console.log("Resolve THEN " + JSON.stringify(list));

                                silenciarNotificaciones(list);

                            }).catch((e) => {
                                console.log("Error al enviar mensajes en el for de envios " + e);
                                reject(null);
                            });
                        }
                    });

            } catch (e) {
                console.log("Error al correr el proceso de generacion de horas extras " + e);
                reject(null);
            }
        }
    });
};

//FIXME: falta modificar el procedimiento para guardar las respuestas

const silenciarNotificaciones = (listaNotificaciones) => {
    console.log("silenciar notificaciones " + JSON.stringify(listaNotificaciones));
    //var listaIds = listaNotificaciones.map(e=>e.id);

    if (listaNotificaciones == null || listaNotificaciones.length > 0) {
        console.log("La lista de notificaciones e null o empty");
        return;
    } else {

        var ids = '';
        var respuestas = '';
        var mensajes_ids = '';

        //var ids = '';
        var first = true;

        for (var i = 0; i < listaNotificaciones.length; i++) {
            var element = listaNotificaciones[i];
            if (first) {
                ids += element.id;
                respuestas += element.notificado;
                mensajes_ids += element.respuesta;

                first = false;
            } else {
                ids += (',' + element.id);
                respuestas += (',' + element.notificado);
                mensajes_ids += (',' + element.respuesta);
            }
        }


        console.log("Ids " + ids);
        console.log("respuestas " + respuestas);
        console.log("mensajes ids " + mensajes_ids);



        try {
            pool.query("select silenciar_notificaciones('" + ids + "','" + respuestas + "','" + mensajes_ids + "');",
                (error, results) => {
                    if (error) {
                        console.log("ERROR al silenciar notificaciones " + error);
                    }
                    console.log("Se llamo a la function para silenciar las notificaciones");
                });
        } catch (e) {
            console.log("Error al correr el proceso de silenciar las notificaciones " + e); dez
        }

    }
};


module.exports = {
    //generarBalanceAlumnos
    ejecutarProcesoHorasExtrasAuto
}