
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
    }).then((res)=>{
        console.log("Siguiente paso ");
        if(res){
            console.log("Iniciando el envio de mensajes ");
            var lista = [];
            //enviar mensaje
            try {
                pool.query("select id,fecha,titulo,cuerpo,icon,token from si_notificacion where notificado = false and fallo = false and eliminado = false",
                    (error, results) => {
                        if (error) {
                            console.log("Error en la consulta de notificaciones ");                    
                            return;
                        }                    
                        if(results != null && results.rowCount > 0 ){
                            results.rows.forEach(e=>{
                                console.log("Enviando mensaje ");                                                    
                                
                                mensajeria.enviarMensajeToken(e.token,e.titulo,e.cuerpo).then((response) => {
                                    console.log(" result" + JSON.stringify(response));                                    
                                    console.log("Envio correcto");
                                    e.respuesta = response.messageId;                                        
                                    e.notificado = (response.successCount > 0);
                                    lista.push(e);                                    
                                }).catch((e) => {
                                    console.log("Error en la mensajeria " + e);
                                    //return e;
                                });                                
                            });                         
                        }                        
                    });
                    silenciarNoticiaciones(lista);
            } catch (e) {
                console.log("Error al correr el proceso de generacion de horas extras " + e);
                reject(null);
            }                       
        }
    });
};

//FIXME: falta modificar el procedimiento para guardar las respuestas

const silenciarNoticiaciones = (listaNotificaciones) =>{
    console.log("silenciar notificaciones ");
    //var listaIds = listaNotificaciones.map(e=>e.id);
    var ids = '';
    var respuestas = '';
    var mensajes_ids = '';
    //var ids = '';
    var first = true;
    listaNotificaciones.forEach(element => {
        if (first) {
            ids += element.id;          
            respuestas+=element.notificado; 
            mensajes_ids+=element.messageId;

            first = false;
        } else {
            ids += (',' + element.id);      
            respuestas+=(',' +element.notificado); 
            mensajes_ids+=(',' +element.messageId);    
        }
      });

    try {
        pool.query("select silenciar_notificaciones('"+ids+"','"+respuestas+"','"+mensajes_ids+"');",
            (error, results) => {
                if (error) {
                    console.log("ERROR al silenciar notificaciones "+error);
                   //reject(null);
                }                    
                console.log("Se llamo a la function para silenciar las notificaciones");                    
                //resolve(true);
            });
    } catch (e) {
        console.log("Error al correr el proceso de silenciar las notificaciones " + e);
       //reject(null);
    }
};


module.exports = {
    //generarBalanceAlumnos
    ejecutarProcesoHorasExtrasAuto
}