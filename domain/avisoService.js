const avisoDao = require('../dao/avisoDao');
//const { getHtmlPreviewTemplate,TEMPLATES } = require('../utils/CorreoService');
const { enviarAviso,obtenerPreviewAviso } = require('../utils/NotificacionAvisoService');

const registrarAviso = async (avisoData) => {
    console.log("@registrarAviso");
    try{  
        
         // const { listaPara } =  avisoData;
         
          let idCoAviso = await avisoDao.registrarAviso(avisoData);            
               
          let infoEnvio = {};
          //publicacion a los usuarios por correo y          
          if(avisoData.enviar && idCoAviso){
               infoEnvio = await enviarAviso(idCoAviso);               
               await avisoDao.registrarEnvio(idCoAviso,infoEnvio,avisoData.genero);               
          }
          return {realizado:false,id:idCoAviso,informacionEnvio:infoEnvio,error:false};
    }catch(error){
        console.log(" registrarAviso ERROR : "+ JSON.stringify(error));
        return {realizado:false,error:error};
   }   
};


const obtenerPreview = async (htmlPreview) => {
    try{
      return await obtenerPreviewAviso(htmlPreview);
    }catch(error){
        console.log(" X X X X X "+error);
        return error;
   }  
};

const modificarAviso = async (avisoData) => {
    console.log("@modificarAviso");
    try{
          return await avisoDao.modificarAviso(avisoData);
    }catch(error){
        console.log(" X X X X X "+error);
        return error;
   }   
};


const getAvisosUsuario = async(idUsuario) => {
    console.log("@getAvisosUsuario");
    return await avisoDao.obtenerAvisos(idUsuario);
};

const getAvisoId = async(idAviso) => {    
    try{
     const aviso = await avisoDao.obtenerAvisoId(idAviso);      
     const listaPara = JSON.parse(aviso.para) || [];
     const idsFamiliar = [];
     listaPara.forEach(element => {
        idsFamiliar.push(element.id_familiar);
    });
    const para = await  avisoDao.obtenerContactosIds(idsFamiliar);
    
    aviso.para = para;

    return aviso;
    }catch(e){
      console.log("error al obtener el aviso por id "+e);  
      return null;
    }
};

const getContactos = async(idsSucursales) => {
    console.log("@getContactos");
    return await avisoDao.obtenerContactos(idsSucursales);
};


const getContactosIds = async(idsFamiliar) => {
    console.log("@getContactosIds");
    return await avisoDao.obtenerContactosIds(idsFamiliar);
};

const eliminarAvisos = async (avisosData) => {
    console.log("@eliminarAvisos");
    return await avisoDao.eliminarAvisos(avisosData);
};


module.exports = {   
   registrarAviso,
   modificarAviso,
   eliminarAvisos,   
   getAvisosUsuario,
   getContactos,
   getAvisoId,
   getContactosIds,
   obtenerPreview

};