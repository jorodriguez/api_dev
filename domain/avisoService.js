const avisoDao = require('../dao/avisoDao');
//const { getHtmlPreviewTemplate,TEMPLATES } = require('../utils/CorreoService');
const { enviarAviso } = require('../utils/NotificacionAvisoService');

const registrarAviso = async (avisoData) => {
    console.log("@registrarAviso");
    try{           
          let idGenerado = await avisoDao.registrarAviso(avisoData);
          let infoEnvio = null;
          if(avisoData.enviar){
               infoEnvio = await enviarAviso(idGenerado);
               await avisoDao.registrarEnvio(idGenerado,infoEnvio,avisoData.genero);
          }
          return {id:idGenerado,informacionEnvio:infoEnvio};
    }catch(error){
        console.log(" registrarAviso ERROR : "+ JSON.stringify(error));
        return error;
   }   
};


const obtenerPreviewAviso = async (avisoData) => {


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
   getContactosIds

};