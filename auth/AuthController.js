
/*const { pool } = require('../db/conexion');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/configJwt');
*/
const handle = require('../helpers/handlersErrors');

const authService = require('../domain/authService');

// GET a Login 
/*const login = (request, response) => {

    console.log("En el login ");
    try {
        const { correo, password } = request.body;

       console.log("correo " + correo + " " + password);

           pool.query(`
            select u.id,
                u.nombre,
                u.correo,
                u.password,
                u.co_sucursal,
                u.permiso_gerente,
                su.nombre AS nombre_sucursal,
			    em.id AS id_empresa,
			    em.nombre as nombre_empresa,
			    (select count(r.*)
        				from si_usuario_sucursal_rol r							
		        		where r.usuario = u.id and r.eliminado = false)	
                AS sucursales
                FROM usuario u inner join co_sucursal su on u.co_sucursal = su.id
                            inner join co_empresa em on em.id = u.co_empresa
            WHERE u.correo = $1 
			     AND u.acceso_sistema = true 
			    AND u.activo = true
			    AND u.eliminado = false
           `,[correo],
            (error, results) => {

                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {

                    var usuario = results.rows[0];

                    var passwordIsValid = bcrypt.compareSync(password, usuario.password);

                    if (!passwordIsValid) return response.status(401).send({ auth: false, token: null, usuario: null });

                    var token = jwt.sign({ id: results.id }, config.secret, {
                        //expiresIn: 86400 // expires in 24 hours
                        expiresIn : 86400
                    });

                    response.status(200).send({ auth: true, token: token, usuario: usuario });
                } else {

                    response.status(400).send({ auth: false, token: null, usuario: null });
                }
            });

    } catch (e) {
        
        response.status(400).send({ auth: false, token: null });
    }
};
*/

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