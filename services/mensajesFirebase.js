
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const firebase = require("firebase-admin");
const { configuracion } = require('../config/ambiente');
const { quitarElementosVaciosArray } = require('../utils/Utils');

const serviceAccount = require('./../config/google_service_messages.json');

const firebaseToken = 'fxjTJg3jQPc:APA91bHDuS-ESYDWoPgxNTn67XmE_7iKsQJpebS4_YJvx4YAcBno03WDwiMHdHE0KOXgkEJT54_whgeWHdIhFf10op_AX0Ia04bPz1qrbSAAtIRSQNhY6ThF9DjAV5k7hVKsHsKFip2j';

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://magic-ff92f.firebaseio.com"
});

const payload = {
    notification: {
        title: 'Notification Test',
        body: 'Ejemplo de mensaje',
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

        if (configuracion.enviar_mensajes) {
            firebase.messaging().sendToDevice(firebaseToken, payloadMensaje, options)
                .then((response) => {
                    console.log(" result" + JSON.stringify(response));
                    return response;
                }).catch((e) => {
                    console.log("Error en la mensajeria " + e);
                    return e;
                });
        } else { console.log("====> NO SE ENVIO EL MENSAJE FIREBASE CONFIGURACION <<<===="); }

    } catch (e) {
        console.log("Erorr al enviar mensaje " + e);
        return false;
    }

}

const enviarMensajeActividad = (titulo, cuerpo, token) => {
    try {
        const payloadMensaje = {
            notification: {
                title: titulo,
                body: cuerpo,
            }
        };

        firebase.messaging().sendToDevice(token, payloadMensaje, options)
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

//token, string[] or string
const enviarMensajeToken = (token, titulo, cuerpo) => {
    try {
        console.log("Enviando mensaje " + titulo + " " + cuerpo);
        const payloadMensaje = {
            notification: {
                title: titulo,
                body: cuerpo,
            }
        };

        var retorno = {};

        if (configuracion.enviar_mensajes) {
            
            quitarElementosVaciosArray(token);

            retorno = firebase.messaging().sendToDevice(token, payloadMensaje, options);
        } else {
            console.log("Caso contrario no enviar mensajes");
            retorno = new Promise((resolve, reject) => {
                setTimeout(function () { resolve("¡ No enviado !"); }, 250);
            });
            console.log("NO SE ENVIO EL MENSAJE FIREBASE CONFIG ");
        }
        return retorno;

    } catch (e) {
        console.log("Erorr al enviar mensaje " + e);
        return false;
    }
}

const sendMessage = (request, response) => {
    console.log("@Enviando mensaje " + JSON.stringify(configuracion));
    try {
        if (configuracion.enviar_mensajes) {
            firebase.messaging().sendToDevice(firebaseToken, payload, options)
                .then((response) => {
                    console.log(" result" + JSON.stringify(response));
                    response.status(200).json(response);
                }).catch((e) => {
                    console.log("Error en la mensajeria " + e);
                    handle.callbackError(e, response);
                });
        } else {
            console.log("NO SE ENVIO EL MENSAJE FIREBASE CONFIG " + JSON.stringify(configuracion));
        }
    } catch (e) {
        console.log("error al enviar mensaje " + e);
        handle.callbackErrorNoControlado(e, response);
    }
};



const enviarMensajePorTema = (titulo,mensaje,id_tema, co_sucursal) => {
    try {

        if (titulo == null || titulo==undefined || titulo=="" || 
            id_tema == null || id_tema==undefined) {
            console.log("valores requeridos para enviar mensajes por tema");
            return;
        }

        console.log("Iniciando proceso de envio de notificacion por salida del alumno tema" + id_tema + " suc " + co_sucursal);

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
                        if(e.token != null){
                            enviarMensajeToken(e.token,titulo,mensaje);
                        }                                             
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
    enviarMensajePorTema,
    enviarMensajeActividad

}