const uploadCloudinaryDao = require('../dao/uploadCoudinaryDao');
const alumnoDao = require('../dao/alumnoDao');
const CONSTANTES= require('../utils/Constantes');

async function upload(idAlumno, genero, imagen) {
    console.log("@upload" + idAlumno);
    console.log("@upload" + genero);    
    console.log("@upload" + (imagen !== undefined));
    //return new Promise((resolve,reject)=>{
    let resultImagen = await uploadCloudinaryDao.uploadCloud(imagen,CONSTANTES.FOLDER_PERFILES_CLOUDNARY);
    console.log("ResulT " + JSON.stringify(resultImagen));

    let idResult = 0;
    if (resultImagen.upload) {
        console.log("@actualizando foto de alumno");
        idResult = await alumnoDao.modificarFotoPerfil(idAlumno, resultImagen.secure_url, genero);
    }
    return idResult > 0;


    //}); 

}

module.exports = { upload }