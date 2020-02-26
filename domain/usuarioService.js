const usuarioDao = require('../dao/usuarioDao');
const {TIPO_USUARIO} = require('../utils/Constantes');

function getUsuariosPorSucursal(idSucursal) {
    return usuarioDao.getUsuarioPorSucursal(idSucursal,TIPO_USUARIO.MAESTRA);
}

function crearUsuario(usuarioData) {
    return usuarioDao.insertarUsuario(usuarioData);
}

function modificarUsuario(idUsuario,usuarioData) {
    return usuarioDao.modificarUsuario(idUsuario,usuarioData);
}

function modificarContrasena(idUsuario,usuarioData) {
    //enviar correo de confirmacion de contraseña
    return usuarioDao.modificarContrasena(idUsuario,usuarioData);
}

function desactivarUsuario(idUsuario,usuarioData) {
    //enviar correo de desactivacion de usuario a rol miss de al suc
    return usuarioDao.desactivarUsuario(idUsuario,usuarioData);
}

function buscarPorId(idUsuario) {
    return usuarioDao.buscarUsuarioId(idUsuario);
}

module.exports = { getUsuariosPorSucursal,crearUsuario,modificarContrasena,modificarUsuario,desactivarUsuario,buscarPorId};