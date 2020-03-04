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
                        new MensajeRetorno(false, "El correo ya se encuentra registrado", null)
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


function editarUsuario(usuarioData) {
    console.log("USERDATA " + JSON.stringify(usuarioData));
    return usuarioDao.modificarUsuario(usuarioData);
}

function modificarUsuarioConCorreo(usuarioData) {
    return new Promise((resolve, reject) => {
        usuarioDao
            .buscarCorreo(usuarioData.correo)
            .then(results => {
                console.log("RESUL " + JSON.stringify(results));
                let cont = results.length;
                var proceder = false;

                if (cont == 0) {
                    console.log("proceder con modificacion no existe el correo");
                    proceder = true;
                } else {
                    if (cont == 1) {
                        console.log("el correo existe una vez, validar que sea del mismo usaurios");
                        //validar que sea el mismo usuario
                        let u = results[0];
                        proceder = (usuarioData.id == u.id);
                    }
                }

                if (proceder) {
                    console.log("USERDATA OOO " + JSON.stringify(usuarioData));
                    editarUsuario(usuarioData)
                        .then(result => {
                            resolve(
                                new MensajeRetorno(true, "Se modificó el usuario", null)
                            );
                        }).catch(error => reject(new MensajeRetorno(false, "Error", error)));

                } else {
                    console.log("El correo ya existe");
                    resolve(
                        new MensajeRetorno(false, "El correo ya se encuentra registrado", null)
                    );
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
    return new Promise((resolve, reject) => {
        usuarioDao.desactivarUsuario(idUsuario, usuarioData)
            .then(result => {
                if (result > 0) {
                    resolve(
                        new MensajeRetorno(true, "Se Eliminó el usuario", null)
                    );
                } else {
                    reject(new MensajeRetorno(false, "Error", null));
                }
            }).catch(error => reject(new MensajeRetorno(false, "Error", error)));
    });
    //return 
}

function buscarPorId(idUsuario) {
    return usuarioDao.buscarUsuarioId(idUsuario);
}

module.exports = {
    getUsuariosPorSucursal,
    crearUsuarioConCorreo, crearUsuario, modificarContrasena,
    modificarUsuario,
    desactivarUsuario,
    buscarPorId,
    modificarUsuarioConCorreo

};