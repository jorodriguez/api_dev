
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
        let listaCorreos = [];
        let listaTokens = [];

        console.log("AVISO "+JSON.stringify(aviso));
        const listaContactos = await avisoDao.obtenerCorreosPorAviso(aviso.id,aviso.co_empresa); //JSON.parse(aviso.para) || [];
        console.log("listaContactos "+listaContactos);
        
         listaCorreos = listaContactos.map(element => element.correo);
         listaTokens = listaContactos.map(element => element.token);

         const correos =  listaCorreos.toString();         
        console.log("Lista de correos "+listaCorreos.toString());
        console.log("Lista de tokens "+listaTokens.toString());
        const usuarioGenero = await usuarioDao.buscarUsuarioId(aviso.genero);
        
        console.log("=== Envio de aviso ===");

        const respuesta = {enviadoCorreo:false,     
                            enviadoMovil:false,
                            infoEnvioCorreo:null,
                            infoEnvioMovil:null,
                            destinatarios: listaContactos ? listaContactos : [],
                            destinatariosMovil: listaTokens ? listaTokens.length:0,
                            destinatariosCorreos: listaCorreos ? listaCorreos.length:0
                        };

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

        if(listaTokens){                        
            console.log("==== Envio de mensajeria=====");
            console.log("Tokens "+listaTokens.toString());
            //const arrayTokens =  Array.from(tokens);
            const infoEnvioMovil =  await mensajeria.enviarMensajeTokenAsync(listaTokens,"Aviso ", `${aviso.titulo}`);
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