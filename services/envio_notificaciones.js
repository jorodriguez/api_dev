
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperTokenMovil');
const mensajeria = require('./mensajesFirebase');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});




module.exports = {
    enviarRecordatorioPago
}