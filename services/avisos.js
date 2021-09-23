
const avisoService = require('../domain/avisoService');
const handle = require('../helpers/handlersErrors');
//const { enviarEstadoCuenta } = require('../utils/NotificacionService');
const {validarToken} = require('../helpers/helperTokenMovil');
const notificacionService = require('../utils/NotificacionService');

const registrarAviso = async (request, response) => {
    console.log("@registrarAviso");
    
    try {
        const params = { fecha, para,id_empresa, titulo, aviso, etiqueta, nota_interna, genero} = request.body;
        const respuesta = await avisoService.registrarAviso(params);                
        console.log("- - - - -Termino el proceso - - -");
        console.log("Respuesta "+JSON.stringify(respuesta));
        response.status(200).json(respuesta);        
    } catch (e) {
        console.log("error al registrar el aviso "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const getAvisosUsuario = async (request, response) =>{
    console.log("@getAvisosUsuarios");
    try{    
     const id = request.params.id_usuario;
     const avisos = await avisoService.getAvisosUsuario(id);   
     response.status(200).json(avisos);
    }catch(e){
        console.log("Error "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const getAvisoId = async (request, response) =>{
    console.log("@getAvisoId");
    try{    
     const id = request.params.id_aviso;
     const aviso = await avisoService.getAvisoId(id);   
     response.status(200).json(aviso);
    }catch(e){
        console.log("Error "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const getContactos = async (request, response) =>{
    console.log("@getContactos");
    try{    
     const { idsSucursales = [] } = request.params;

     console.log("SUCURSALES "+idsSucursales);
    
     const contactos = await avisoService.getContactos(JSON.parse(idsSucursales));
     response.status(200).json(contactos);
    }catch(e){
        console.log("Error "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const getTagsContactos = async (request, response) =>{
    console.log("@getTagsContactos");
    try{    
     const { idUsuario = [] } = request.params;

     console.log("usuario "+idUsuario);
    
     const contactos = await avisoService.getTagsContactos(idUsuario);
     response.status(200).json(contactos);
    }catch(e){
        console.log("Error "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const getAvisosPorFamiliar = async (request, response) =>{
    console.log("@getAvisosPorFamiliar");
    try{    
/*
    let respuesta = validarToken(request,response);

     if (!respuesta.tokenValido) {
          return response.status(respuesta.statusNumber).send(respuesta);
     }
     */
     const { id_familiar } = request.params;     
     console.log("idFamiliar "+id_familiar);
    
     const avisos = await avisoService.getAvisosPorFamiliar(id_familiar);
     response.status(200).json(avisos);
    }catch(e){
        console.log("Error al obtener avisos por familair"+e);
        handle.callbackErrorNoControlado(e, response);
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
        const modificacion = await avisoService.modificarAviso({id,...avisoData});
        response.status(200).json(!!modificacion);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const obtenerHtmlPreviewAviso = async (request, response) => {
    console.log("@obtenerHtmlPreviewAviso");    
    try {

        const { htmlAviso } = request.params;

        const html = await avisoService.obtenerPreview(htmlAviso);

        //response.status(200).json(html);               
        response.status(200).send(html);

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};



module.exports = {
   registrarAviso,
   modificarAviso,
   getAvisosUsuario,
   eliminarAvisos,
   getContactos,
   obtenerHtmlPreviewAviso,
   getTagsContactos,
   getAvisosPorFamiliar
};