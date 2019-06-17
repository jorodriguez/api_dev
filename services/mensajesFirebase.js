
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const firebase = require("firebase-admin");

const serviceAccount = require('./../config/google_service_messages.json');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const firebaseToken = 'cn-FW4DpdkA:APA91bF_WOFoytM4x-ZPJgEmqLXU6oTQ-BJcfnoT4AUAXHXYde0XvCvlpEHRruZoeE3ykgR9OWCgXkF7blWSPInmTMRUuW1aXi_9yV3RQ_I21veVfq3E4GXI-8wlkci447tv27Nj9wep';

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://magic-ff92f.firebaseio.com"
});

const payload = {
    notification: {
        title: 'Notification Title',
        body: 'Ejemplo de cuerpo de mensaje',
    }
};

const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 1 day
};

const enviarMensaje = (titulo, cuerpo) => {
    try {
        const payloadMensaje = {
            notification: {
                title: titulo,
                body: cuerpo,
            }
        };

        firebase.messaging().sendToDevice(firebaseToken, payloadMensaje, options)
            .then((response) => {
                console.log(" result" + JSON.stringify(response));
                return response;
            }).catch((e) => {
                console.log("Error en la mensajeria " + e);
                return e;
            });

    } catch (e) {
        console.log("Erorr al enviar mensaje " + e);
        return false;
    }

}


const enviarMensajeToken = (token, titulo, cuerpo) => {
    try {
        console.log("Enviando mensaje " + titulo + " " + cuerpo);
        const payloadMensaje = {
            notification: {
                title: titulo,
                body: cuerpo,
            }
        };

        return firebase.messaging().sendToDevice(token, payloadMensaje, options);


    } catch (e) {
        console.log("Erorr al enviar mensaje " + e);
        return false;
    }

}



const sendMessage = (request, response) => {
    console.log("@Enviando mensaje");
    try {
        firebase.messaging().sendToDevice(firebaseToken, payload, options)
            .then((response) => {
                console.log(" result" + JSON.stringify(response));
                response.status(200).json(response);
            }).catch((e) => {
                console.log("Error en la mensajeria " + e);
                handle.callbackError(e, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const enviarMensajePorTema = (alumnosArray,id_tema, co_sucursal,handler) => {
    try {

        
        if(alumnosArray == null || alumnosArray.length == 0){
            console.log("el array es empty o null");
            return; 
        }
        
        console.log("Iniciando proceso de envio de notificacion por salida del alumno tema"+id_tema+" suc "+co_sucursal);

        pool.query("SELECT distinct u.token,u.correo,u.nombre " +
            "   FROM CO_USUARIO_NOTIFICACION n inner join usuario u on n.usuario = u.id" +
            "   where n.co_sucursal = $1 " +
            "   and n.co_tema_notificacion in (1,$2) " +
            "   and n.eliminado = false   " +
            "   and u.eliminado = false",
            [co_sucursal, id_tema],
            (error, results) => {
                if (error) {
                    console.log("Error en query de usuario notificacion " + error);
                    return;
                }
                if (results.rowCount > 0) {
                    console.log("inciando envio de notificaciones ");
                    results.rows.forEach(e => {                       

                        alumnosArray.forEach(alumno=>{
                            console.log("Enviar notificacion del alumno "+alumno.nombre);
                            //crear un handler
                            handler(e.token,alumno);
                        });                        
                    });
                } else {
                    console.log("No existen alumnos proximos  a salir ");
                }

            });
    } catch (e) {
        console.log("Error al correr el proceso de generacion de horas extras " + e);

    }

};

module.exports = {
    enviarMensaje,
    sendMessage,
    enviarMensajeToken,
    enviarMensajePorTema
}