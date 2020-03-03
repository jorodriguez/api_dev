
const { pool } = require('../db/conexion');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/configJwt');
const handle = require('../helpers/handlersErrors');

//  POST—users | createUser()
const createUser = (request, response) => {
    try {
        //fixme :
        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });

        const { nombre, correo, password } = request.body;

        console.log('Parametros recibido ' + nombre + ' corre ' + correo + ' pass ' + password);

        var hashedPassword = bcrypt.hashSync(password, 8);

        pool.query('INSERT INTO USUARIO (NOMBRE,CORREO,PASSWORD) VALUES($1,$2,$3)', [nombre, correo, hashedPassword], (error, results) => {
            if (error) {
                handle.callbackError(error, response);
                    return;
            }
            // create a token
            var token = jwt.sign({ id: results.id }, config.secret, {                
                expiresIn: 86400 // expires in 24 hours                
                //expiresIn :'30d'
            });

            response.status(200).send({ auth: true, token: token });
        });

    } catch (e) {
        //handle.callbackErrorNoControlado(e, response);
        response.status(400).send({ auth: false, token: null });
    }
};


// GET a Login 
const login = (request, response) => {

    console.log("En el login ");
    try {
        const { correo, password } = request.body;

        console.log("correo " + correo + " " + password);

        pool.query("select u.id," +
            " u.nombre," +
            " u.correo," +
            " u.password," +
            " u.co_sucursal," +
            " u.permiso_gerente," +
            " su.nombre as nombre_sucursal" +
            " FROM usuario u inner join co_sucursal su on u.co_sucursal = su.id" +
            " WHERE u.correo = $1 AND u.acceso_sistema = true AND u.eliminado = false",
            [correo],
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



module.exports = {
    createUser,
    login,
   // encriptar
};