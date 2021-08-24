const avisoDao = require('../dao/avisoDao');
const { getHtmlPreviewTemplate,TEMPLATES,enviarCorreoTemplate } = require('../utils/CorreoService');

const registrarAviso = async (avisoData) => {
    console.log("@registrarAviso");
    try{
          return await avisoDao.registrarAviso(avisoData);          
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


const enviarAviso = async (avisoData) => {
    console.log("@enviarAviso");
    try{
            const {para,titulo,aviso,etiqueta,nota_interna, genero } = avisoData;

           // enviarCorreoTemplate(para,'',titulo,)

            await avisoDao.registrarEnvio(avisoData);
    }catch(error){
        console.log(" X X X X X "+error);
        return error;
   }   
};


const getAvisosUsuario = async(idUsuario) => {
    console.log("@getAvisosUsuario");
    return await avisoDao.obtenerAvisos(idUsuario);
};


const getContactos = async(idsSucursales) => {
    console.log("@getContactos");
    return await avisoDao.obtenerContactos(idsSucursales);
};


const eliminarAvisos = async (avisosData) => {
    console.log("@eliminarAvisos");
    return await avisoDao.eliminarAvisos(avisosData);
};

/*
const obtenerPreviewAviso = async (idAlumno)=>{
    const params = await obtenerEstadoCuentaAlumno(idAlumno);
    return await getHtmlPreviewTemplate(TEMPLATES.TEMPLATE_ESTADO_CUENTA,params);
};*/




module.exports = {   
   registrarAviso,
   modificarAviso,
   eliminarAvisos,
   enviarAviso,
   getAvisosUsuario,
   getContactos

};