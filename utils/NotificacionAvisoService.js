
const mensajeria = require('../services/mensajesFirebase');
//const { TEMA_NOTIFICACION } = require('./Constantes');
const correoService = require('./CorreoService');
const { TEMPLATES } = require('./CorreoService');
const avisoDao = require('../dao/avisoDao');
const usuarioDao = require('../dao/usuarioDao');


const enviarAviso = async (idAviso) => {    
    console.log("@enviarAviso");
    //buscar el correo de los usuarios y obtener el correo y token

    const aviso = await avisoDao.obtenerAvisoId(idAviso);  
    
   if (!aviso) {
        console.log("No se encontro el aviso");
        throw "No se encontro el id del aviso";
    } else {
        const idsFamiliar = [];

        console.log("AVISO "+JSON.stringify(aviso));
        const listaPara = JSON.parse(aviso.para) || [];
        console.log("listaPara "+listaPara);
        
        listaPara.forEach(element => {
            idsFamiliar.push(element.id_familiar);
        });
        
        const lista = await avisoDao.obtenerContactosIds(idsFamiliar);
        const usuarioGenero = await usuarioDao.buscarUsuarioId(aviso.genero);
        
        let correos = '';
        const tokens = new Set();
        let firstCorreo = true;
        
        if(lista){
            lista.forEach(element => {
                if(firstCorreo){
                    correos+=element.correo;
                    firstCorreo = false;
                }else{
                    correos+=','+element.correo;
                }
                
                if(element.token){
                    tokens.add(element.token);
                }
            });
        }

        console.log("=== Envio de aviso ===");

        const respuesta = {enviadoCorreo:false, enviadoMovil:false,infoEnvioCorreo:null,infoEnvioMovil:null};

        const responseEnvioCorreo = await correoService.enviarCorreoTemplateAsync(
                `${correos}`,
                `${usuarioGenero.correo}`,                  
                `${aviso.titulo}`,
                {aviso:aviso.aviso},
                TEMPLATES.TEMPLATE_AVISO                
                );     

        respuesta.enviadoCorreo = responseEnvioCorreo.enviado;
        respuesta.infoEnvioCorreo = responseEnvioCorreo;
    
        console.log("RESPUESTA DE ENVIO DE CORREO "+JSON.stringify(responseEnvioCorreo));

        if(tokens.size > 0){            
            //avisoDao.registrarEnvio();
            console.log("==== Envio de mensajeria=====");
            const arrayTokens =  Array.from(tokens);
            const infoEnvioMovil =  await mensajeria.enviarMensajeTokenAsync(arrayTokens,"Aviso ", `${aviso.titulo}`);
            respuesta.enviadoMovil = infoEnvioMovil.enviado;
            respuesta.infoEnvioMovil = infoEnvioMovil;

       }else{
            console.log("==== No existen tokens en la lista =====");
       }

        return respuesta;
    }
};

const obtenerPreviewAviso = async (avisoHtml)=>{   
    //const aviso = await avisoDao.obtenerAvisoId(idAviso);  
    return await correoService.getHtmlPreviewTemplate(TEMPLATES.TEMPLATE_AVISO,{aviso:avisoHtml});
};

module.exports = {
        enviarAviso,
        obtenerPreviewAviso
};