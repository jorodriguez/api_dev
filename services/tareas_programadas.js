
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria  = require('./mensajesFirebase');

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


module.exports = {
    //generarBalanceAlumnos
}