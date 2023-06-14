const mensajeria = require('../services/mensajesFirebase');
//const { TEMA_NOTIFICACION } = require('./Constantes');
const correoService = require('./CorreoService');
const { TEMPLATES } = require('./CorreoService');
const avisoDao = require('../dao/avisoDao');
const usuarioDao = require('../dao/usuarioDao');


const enviarAviso = async(idAviso) => {
    console.log("@enviarAviso");
    //buscar el correo de los usuarios y obtener el correo y token

    const aviso = await avisoDao.obtenerAvisoId(idAviso);

    if (!aviso) {
        console.log("No se encontro el aviso");
        throw "No se encontro el id del aviso";
    } else {

        //console.log("AVISO " + JSON.stringify(aviso));
        const listaContactos = await avisoDao.obtenerCorreosPorAviso(aviso); //JSON.parse(aviso.para) || [];
        console.log("listaContactos " + listaContactos);

        const listaCorreoTemp = listaContactos.filter(e => e.correo != null).map(element => element.correo);
        const listaTokensTemp = listaContactos.filter(e => e.token != null).map(element => element.token);

        const listaCorreos = new Set(listaCorreoTemp);
        const listaTokens = new Set(listaTokensTemp);

        const correos = Array.from(listaCorreos).toString();
        const tokens = Array.from(listaTokens);
        console.log("Lista de correos " + correos);
        //console.log("Lista de tokens "+tokens.toString());
        const usuarioGenero = await usuarioDao.buscarUsuarioId(aviso.genero);

        console.log("=== Envio de aviso ===");

        const respuesta = {
            envioCorreo: false,
            envioMovil: false,
            infoEnvioCorreo: null,
            infoEnvioMovil: null,
            destinatarios: listaContactos ? listaContactos : [],
            destinatariosMovil: listaTokens ? listaTokens.length : 0,
            destinatariosCorreos: listaCorreos ? listaCorreos.length : 0
        };

        const responseEnvioCorreo = await correoService.enviarCorreoTemplateAsync(
            `${correos}`,
            `${usuarioGenero.correo}`,
            `${aviso.titulo}`, { aviso: aviso.aviso },
            TEMPLATES.TEMPLATE_AVISO
        );

        await sleep(5000);


        respuesta.envioCorreo = responseEnvioCorreo.enviado;
        respuesta.infoEnvioCorreo = responseEnvioCorreo;

        console.log("RESPUESTA DE ENVIO DE CORREO " + JSON.stringify(responseEnvioCorreo));

        // por ahora no van los tokens
        /*if(tokens){                        
            console.log("==== Envio de mensajeria=====");
            console.log("Tokens "+listaTokens);
            //const arrayTokens =  Array.from(tokens);
            const infoEnvioMovil =  await mensajeria.enviarMensajeTokenAsync(tokens,"Aviso ", `${aviso.titulo}`);
            respuesta.envioMovil = infoEnvioMovil.enviado;
            respuesta.infoEnvioMovil = infoEnvioMovil;
       }else{
            console.log("==== No existen tokens en la lista =====");
            
       }*/

        return respuesta;
    }
};

const sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};


const obtenerPreviewAviso = async(avisoHtml) => {
    //const aviso = await avisoDao.obtenerAvisoId(idAviso);  
    return await correoService.getHtmlPreviewTemplate(TEMPLATES.TEMPLATE_AVISO, { aviso: avisoHtml });
};

module.exports = {
    enviarAviso,
    obtenerPreviewAviso
};