
/*const { pool } = require('../db/conexion');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/configJwt');
*/
const handle = require('../helpers/handlersErrors');

const authService = require('../domain/authService');

const login = (request, response) => {
    console.log("@LOGIN ");
    try {

        const { correo, password } = request.body;

        authService
            .login(correo, password)
            .then(result => {
                console.log(" LOGIN RESULT " + result);
                response.status(200).json(result);
            }).catch(error => {
                console.error(error);
                handle.callbackError(error, response);
            });

    } catch (e) {
        console.error(e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const obtenerSucursalesUsuario = (request, response) => {
    console.log("@obtenerSucursalesUsuario ");
    try {

        //idUsuario
        const { id } = request.params;

        authService
            .obtenerSucursalesUsuario(id)
            .then(results => {
                console.log(" SUCURSALES RESULT " + results);
                response.status(200).json(results);
            }).catch(error => {
                console.error(error);
                handle.callbackError(error, response);
            });

    } catch (e) {
        console.error(e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const cambiarSucursalUsuario = (request, response) => {
    console.log("@cambiarSucursalUsuario ");
    try {

        //idUsuario
        const { id_usuario, id_sucursal } = request.body;

        var token = request.headers['x-access-token'];

        authService
            .cambiarSucursalUsuario(id_usuario, id_sucursal, token)
            .then(results => {
                console.log(" Cambio suc " + results);
                if (results != null) {

                    response.status(200).json(results);

                }
            }).catch(error => {
                console.error(error);
                handle.callbackError(error, response);
            });

    } catch (e) {
        console.error(e);
        handle.callbackErrorNoControlado(e, response);
    }
};




module.exports = {
    login, obtenerSucursalesUsuario, cambiarSucursalUsuario
    // encriptar
};