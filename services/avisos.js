
const avisoService = require('../domain/avisoService');
const handle = require('../helpers/handlersErrors');
//const { enviarEstadoCuenta } = require('../utils/NotificacionService');
//const notificacionService = require('../utils/NotificacionService');

const registrarAviso = async (request, response) => {
    console.log("@registrarAviso");
    
    try {
        const params = { fecha, para, titulo, aviso, etiqueta, nota_interna, genero} = request.body;
        
        const respuesta = await avisoService.registrarAviso(params);
        /*if(respuesta && respuesta.resultado){
            notificacionService.notificarCargo(params.id_alumno,respuesta.id_cargo);
        } */       
        response.status(200).json(respuesta);        
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getAvisosUsuario = async (request, response) =>{
    console.log("@getAvisosUsuarios");
    try{
    
    const id = request.params.id_usuario;
    return await avisoService.getAvisosUsuario(id);   
    }catch(e){
        console.log("Error "+e);
    }
};


const eliminarAvisos = async (request, response) => {
    console.log("@eliminarAvisos");
    try {
        const avisosData = { ids, genero } = request.body;
        const eliminacion = await avisoService.eliminarAvisos(avisosData);
        response.status(200).json(!!eliminacion);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const modificarAviso = async (request, response) => {
    console.log("@modificarAvisos");
    try {
        const avisoData = { para,titulo,aviso,etiqueta,nota_interna, genero } = request.body;
        const id = request.params.id;
        const modificacion = await avisoService.modificarAviso({id,...avisoData})
        response.status(200).json(!!modificacion);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};
/*
const obtenerHtmlPreviewEstadoCuenta = async (request, response) => {
    console.log("@obtenerHtmlPreviewEstadoCuenta");    
    try {

        const { id_alumno } = request.params;

        const html = await cargoService.obtenerPreviewEstadoCuenta(id_alumno);

        //response.status(200).json(html);               
        response.status(200).send(html);

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};
*/


module.exports = {
   registrarAviso,
   modificarAviso,
   getAvisosUsuario,
   eliminarAvisos
};