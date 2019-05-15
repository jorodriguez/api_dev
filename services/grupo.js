
const Pool = require('pg').Pool
const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const config = require('../config/config');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const getGrupos = (request, response) => {
    try {

        var token = request.headers['x-access-token'];
        if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err)
                return response.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        });

        pool.query("SELECT * from co_grupo WHERE eliminado = false",
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getGrupos    
}