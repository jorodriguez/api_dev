const dotenv = require('dotenv').config();

module.exports = {
    ENV: process.env.ENV || 'local_development',
    HOST: process.env.HOST || '127.0.0.1',
    PORT: process.env.PORT || 5000,
    USER_DB: process.env.USER_DB || '',
    HOST_DB: process.env.HOST_DB || '',
    DATABASE_NAME:process.env.DATABASE_NAME || '',
    PASSWORD_DB:process.env.PASSWORD_DB ||'',
    PORT_DB : process.env.PORT_DB ||5432,
    CONFIG_EMAIL: process.env.CONFIG_EMAIL && JSON.parse(`${process.env.CONFIG_EMAIL}`),
    ENVIAR_MENSAJES_MOVIL: process.env.ENVIAR_MENSAJES_MOVIL || false
};