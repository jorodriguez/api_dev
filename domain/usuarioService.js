const usuarioDao = require('../dao/usuarioDao');
const { TIPO_USUARIO } = require('../utils/Constantes');
const { MensajeRetorno } = require('../utils/MensajeRetorno');

function getUsuariosPorSucursal(idSucursal) {
    return usuarioDao.getUsuarioPorSucursal(idSucursal, TIPO_USUARIO.MAESTRA);
}

function crearUsuarioConCorreo(usuarioData) {
    console.log("@crearUsuarioConCorreo");
    return new Promise((resolve, reject) => {
        usuarioDao
            .validarCorreoUsuario(usuarioData.correo)
            .then(encontrado => {
                if (encontrado) {
                    resolve(
                        new MensajeRetorno(false, "El correo ya se encutra registrado con otro usuario", null)
                    );
                } else {
                    insertarUsuario(usuarioData)
                        .then(result => {
                            resolve(
                                new MensajeRetorno(true, "Se registró el usuario", null)
                            );
                        }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
                }

            }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
    });
}

function insertarUsuario(usuarioData) {
    return usuarioDao.insertarUsuario(usuarioData);
}

function crearUsuario(usuarioData) {
    console.log("@crearUsuario");
    return new Promise((resolve, reject) => {
        insertarUsuario(usuarioData)
            .then(result => {
                resolve(
                    new MensajeRetorno(true, "Se registró el usuario", null)
                );
            }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
    });
}


function editarUsuario(idUsuario, usuarioData) {
    console.log("USERDATA "+JSON.stringify(usuarioData));
    return usuarioDao.modificarUsuario(idUsuario, usuarioData);
}

function modificarUsuarioConCorreo(usuarioData) {
    return new Promise((resolve, reject) => {
        usuarioDao
            .buscarCorreo(usuarioData.correo)
            .then(results => {
                console.log("RESUL "+JSON.stringify(results));
                if (results.length > 1) {                    
                    resolve(
                        new MensajeRetorno(false, "El correo ya se encutra registrado con otro usuario", null)
                    );
                } else {
                    console.log("USERDATA OOO "+JSON.stringify(usuarioData));
                    editarUsuario(usuarioData.id,usuarioData)
                        .then(result => {
                            resolve(
                                new MensajeRetorno(true, "Se modificó el usuario", null)
                            );
                        }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
                }
            });
    });
}

function modificarUsuario(usuarioData) {
    return new Promise((resolve, reject) => {
        editarUsuario(usuarioData)
            .then(result => {
                resolve(
                    new MensajeRetorno(true, "Se modificó el usuario", null)
                );
            }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
    });

}


function modificarContrasena(idUsuario, usuarioData) {
    //enviar correo de confirmacion de contraseña
    return usuarioDao.modificarContrasena(idUsuario, usuarioData);
}

function desactivarUsuario(idUsuario, usuarioData) {
    //enviar correo de desactivacion de usuario a rol miss de al suc
    return usuarioDao.desactivarUsuario(idUsuario, usuarioData);
}

function buscarPorId(idUsuario) {
    return usuarioDao.buscarUsuarioId(idUsuario);
}

module.exports = { getUsuariosPorSucursal, 
                    crearUsuarioConCorreo, crearUsuario, modificarContrasena, 
                    modificarUsuario, 
                    desactivarUsuario, 
                    buscarPorId,
                    modificarUsuarioConCorreo
                    
                     };