
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
        let tokens = [];
        let firstCorreo = true;
        
        if(lista){
            lista.forEach(element => {
                if(firstCorreo){
                    correos+=element.correo;
                    firstCorreo = false;
                }else{
                    correos+=','+element.correo;
                }
                
                if(element.token != null){
                    tokens.push(element.token);
                }
            });
        }

        console.log("=== Envio de aviso ===");

        const responseEnvio = await correoService.enviarCorreoTemplateAsync(
                `${correos}`,
                `${usuarioGenero.correo}`,                  
                `${aviso.titulo}`,
                {aviso:aviso.aviso},
                TEMPLATES.TEMPLATE_AVISO                
                );      
    
        console.log("RESPUES DE ENVIO "+JSON.stringify(responseEnvio));

        if(responseEnvio.enviado){            
            //avisoDao.registrarEnvio();
            console.log("==== Envio de mensajeria=====");
            mensajeria.enviarMensajeToken(tokens,"Aviso ", `${aviso.titulo}`);
        }

        return responseEnvio;
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